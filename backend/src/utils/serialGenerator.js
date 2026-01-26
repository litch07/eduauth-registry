const pool = require('../config/database');

/**
 * Convert a decimal number to Base-36 string
 * Base-36 uses characters 0-9 and A-Z
 * Example: 12345 → "9IX"
 * 
 * @param {number} num - Decimal number to convert
 * @returns {string} Base-36 representation in uppercase
 */
function toBase36(num) {
    return num.toString(36).toUpperCase();
}

/**
 * Calculate check digit for a 6-character Base-36 serial
 * Uses weighted sum algorithm:
 * - Weights: [7, 3, 1, 7, 3, 1]
 * - Each Base-36 character converted to value (0-35)
 * - Multiply by weight, sum all values
 * - Check digit = (sum % 36) as Base-36 character
 * 
 * Example: If serial is "A7K9M3", calculate weighted sum and return check digit
 * 
 * @param {string} base36Serial - 6-character Base-36 string
 * @returns {string} Single character check digit (0-9, A-Z)
 */
function calculateCheckDigit(base36Serial) {
    const weights = [7, 3, 1, 7, 3, 1];
    let sum = 0;
    
    // Iterate through each character in the serial
    for (let i = 0; i < base36Serial.length; i++) {
        const char = base36Serial[i].toUpperCase();
        
        // Convert Base-36 character to numeric value
        // 0-9 = 0-9, A-Z = 10-35
        let value;
        if (char >= '0' && char <= '9') {
            value = parseInt(char);
        } else {
            value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
        }
        
        // Add weighted value to sum
        sum += value * weights[i];
    }
    
    // Calculate check digit as (sum mod 36) converted to Base-36
    const checkDigitValue = sum % 36;
    return toBase36(checkDigitValue);
}

/**
 * Generate a unique, transaction-safe certificate serial number
 * Serial format: DEG-YY-SEQ6C
 * 
 * Where:
 * - DEG = Degree level (BSC, MSC, PHD)
 * - YY = Current year (2 digits): "25" for 2025, "26" for 2026
 * - SEQ6 = 6-character Base-36 sequence (padded with zeros)
 * - C = Check digit (validates SEQ6)
 * 
 * Example outputs:
 * - BSC-25-000001M (1st bachelor certificate in 2025)
 * - MSC-25-000A3KP (Master's with sequence 12345)
 * - PHD-26-001XYZQ (Doctorate in 2026)
 * 
 * Uses database transaction with row locking (FOR UPDATE) to ensure:
 * - No duplicate serials across concurrent requests
 * - Atomic increment of sequence counter
 * 
 * Algorithm:
 * 1. Get connection and start transaction
 * 2. Lock CertificateSequence row with SELECT...FOR UPDATE
 * 3. Increment sequence counter
 * 4. Update database with new counter
 * 5. Commit transaction
 * 6. Convert degree level to prefix (BACHELOR→"BSC", MASTER→"MSC", DOCTORATE→"PHD")
 * 7. Get current year (last 2 digits)
 * 8. Convert sequence to Base-36 (6 characters, padded with zeros)
 * 9. Calculate check digit on SEQ6
 * 10. Combine: ${prefix}-${year}-${seq6}${checksum}
 * 
 * @async
 * @param {string} certificateLevel - Degree level: "BACHELOR", "MASTER", or "DOCTORATE"
 * @returns {Promise<{serial: string, sequenceNumber: number}>} 
 *   Object containing: serial (formatted string) and sequenceNumber (for audit trail)
 * @throws {Error} If transaction fails, invalid level, or database error occurs
 */
async function generateCertificateSerial(certificateLevel) {
    // Map degree level to prefix
    const degreeMap = {
        'BACHELOR': 'BSC',
        'MASTER': 'MSC',
        'DOCTORATE': 'PHD'
    };
    
    const prefix = degreeMap[certificateLevel?.toUpperCase()];
    if (!prefix) {
        throw new Error(`Invalid certificate level: ${certificateLevel}. Must be BACHELOR, MASTER, or DOCTORATE.`);
    }
    
    let connection;
    try {
        // Get connection from pool
        connection = await pool.getConnection();
        
        // Start transaction for atomic operation
        await connection.beginTransaction();
        
        // Lock the row to prevent concurrent increments
        // FOR UPDATE ensures exclusive lock until transaction commits
        const [rows] = await connection.execute(
            'SELECT lastSequence FROM CertificateSequence WHERE id = 1 FOR UPDATE'
        );
        
        if (rows.length === 0) {
            throw new Error('CertificateSequence record not found');
        }
        
        // Calculate next sequence number
        const currentSequence = rows[0].lastSequence;
        const nextSequence = currentSequence + 1;
        
        // Update sequence counter in database
        await connection.execute(
            'UPDATE CertificateSequence SET lastSequence = ? WHERE id = 1',
            [nextSequence]
        );
        
        // Commit transaction
        await connection.commit();
        
        // Get current year (last 2 digits)
        const currentYear = String(new Date().getFullYear() % 100).padStart(2, '0');
        
        // Convert sequence number to Base-36 and pad to 6 characters with leading zeros
        let base36Serial = toBase36(nextSequence);
        base36Serial = base36Serial.padStart(6, '0');
        
        // Calculate check digit on SEQ6 only
        const checkDigit = calculateCheckDigit(base36Serial);
        
        // Combine: DEG-YY-SEQ6C
        const serial = `${prefix}-${currentYear}-${base36Serial}${checkDigit}`;
        
        return {
            serial,
            sequenceNumber: nextSequence
        };
    } catch (error) {
        // Rollback transaction on error
        if (connection) {
            await connection.rollback();
        }
        throw new Error(`Failed to generate certificate serial: ${error.message}`);
    } finally {
        // Release connection back to pool
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Validate certificate serial format and check digit
 * 
 * Serial format: DEG-YY-SEQ6C
 * Regex: /^(BSC|MSC|PHD)-\d{2}-[0-9A-Z]{7}$/
 * 
 * Validation steps:
 * 1. Check format: DEG-YY-SEQ6C structure
 * 2. Verify degree level (BSC, MSC, or PHD)
 * 3. Verify year is 2 digits
 * 4. Extract SEQ6 (first 6 chars) and check digit (7th char)
 * 5. Recalculate check digit from SEQ6
 * 6. Compare recalculated vs provided check digit
 * 
 * @param {string} serial - Serial to validate (e.g., "BSC-25-000001M")
 * @returns {boolean} True if serial is valid, false otherwise
 */
function validateSerial(serial) {
    // Check format: DEG-YY-SEQ6C (e.g., "BSC-25-000001M")
    if (!serial || !/^(BSC|MSC|PHD)-\d{2}-[0-9A-Z]{7}$/i.test(serial)) {
        return false;
    }
    
    // Extract SEQ6 (first 6 characters of last part) and check digit (7th character)
    const parts = serial.split('-');
    const seq6WithChecksum = parts[2];  // "000001M"
    
    const base = seq6WithChecksum.substring(0, 6);  // "000001"
    const providedCheckDigit = seq6WithChecksum[6].toUpperCase();  // "M"
    
    // Recalculate check digit from the base
    const calculatedCheckDigit = calculateCheckDigit(base);
    
    // Serial is valid only if check digits match
    return providedCheckDigit === calculatedCheckDigit;
}

module.exports = {
    toBase36,
    calculateCheckDigit,
    generateCertificateSerial,
    validateSerial
};

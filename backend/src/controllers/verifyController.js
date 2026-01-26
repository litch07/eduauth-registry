const pool = require('../config/database');
const { validateSerial } = require('../utils/serialGenerator');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

/**
 * Public certificate verification
 * Allows anyone to verify a certificate using Serial Number + Date of Birth
 * Only publicly shareable certificates can be verified
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyCertificate(req, res) {
    try {
        // Extract serial and dateOfBirth from request body
        const { serial, dateOfBirth } = req.body;
        
        // Validate serial is provided
        if (!serial) {
            return res.status(400).json({
                error: 'Serial number is required'
            });
        }
        
        // Validate serial format and checksum (DEG-YY-SEQ6C, e.g., BSC-25-000001M)
        if (!validateSerial(serial.toUpperCase())) {
            return res.status(400).json({
                error: 'Serial must match format BSC-25-000001M'
            });
        }
        
        // Validate dateOfBirth is provided
        if (!dateOfBirth) {
            return res.status(400).json({
                error: 'Date of birth is required'
            });
        }
        
        // Validate dateOfBirth format: DD/MM/YYYY or YYYY-MM-DD
        let dobMatch = dateOfBirth.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        let day;
        let month;
        let year;
        if (dobMatch) {
            day = dobMatch[1];
            month = dobMatch[2];
            year = dobMatch[3];
        } else {
            const isoMatch = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!isoMatch) {
                return res.status(400).json({
                    error: 'Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD'
                });
            }
            year = isoMatch[1];
            month = isoMatch[2];
            day = isoMatch[3];
        }
        
        // Convert to YYYY-MM-DD format for MySQL query
        const mysqlDob = `${year}-${month}-${day}`;
        
        // Validate date values are reasonable
        if (parseInt(day) < 1 || parseInt(day) > 31 || 
            parseInt(month) < 1 || parseInt(month) > 12 ||
            parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear()) {
            return res.status(400).json({
                error: 'Invalid date of birth'
            });
        }
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Query certificate with all required information using view
            // View already filters soft-deleted records (deletedAt IS NULL)
            const [results] = await connection.execute(
                `SELECT 
                    id,
                    serial,
                    certificateLevel,
                    certificateName,
                    department,
                    major,
                    session,
                    cgpa,
                    degreeClass,
                    DATE_FORMAT(issueDate, '%d/%m/%Y') AS issueDate,
                    DATE_FORMAT(convocationDate, '%d/%m/%Y') AS convocationDate,
                    authorityName,
                    authorityTitle,
                    isPubliclyShareable,
                    studentFullName,
                    DATE_FORMAT(studentDOB, '%d/%m/%Y') AS studentDOB,
                    studentId,
                    institutionName,
                    institutionRegistration,
                    rollNumber
                FROM vw_certificates_full
                WHERE serial = UPPER(?)
                    AND DATE(studentDOB) = ?`,
                [serial, mysqlDob]
            );
            
            // Check if certificate was found
            if (results.length === 0) {
                return res.status(404).json({
                    verified: false,
                    message: 'Certificate not found or verification details do not match'
                });
            }
            
            // Certificate found - check if it's publicly shareable
            const certificate = results[0];
            
            // If certificate is private, return that it exists but requires approval
            if (certificate.isPubliclyShareable === false || certificate.isPubliclyShareable === 0) {
                return res.status(200).json({
                    verified: false,
                    isPrivate: true,
                    certificateExists: true,
                    serial: serial.toUpperCase(),
                    message: 'This certificate requires student approval to view.',
                    hint: 'The certificate holder has restricted public access. You can request access to view details.'
                });
            }
            
            // Log verification attempt
            const logId = uuidv4();
            const verifierIP = req.ip || req.connection.remoteAddress;
            
            // Try to get country from IP (optional, can fail silently)
            let verifierCountry = null;
            try {
                const geoResponse = await axios.get(`http://ip-api.com/json/${verifierIP}`);
                verifierCountry = geoResponse.data.country;
            } catch (error) {
                // Ignore geo errors
            }
            
            // Sanitize user agent to prevent XSS/injection (truncate to 500 chars)
            const rawUserAgent = req.get('user-agent') || '';
            const sanitizedUserAgent = rawUserAgent
                .replace(/[<>'"]/g, '') // Remove potential XSS characters
                .substring(0, 500);     // Limit length
            
            // Log the verification
            try {
                await connection.execute(
                    'INSERT INTO VerificationLog (id, certificateId, verifierIP, verifierCountry, verifierUserAgent, verifiedAt) VALUES (?, ?, ?, ?, ?, NOW())',
                    [logId, certificate.id, verifierIP, verifierCountry, sanitizedUserAgent]
                );
            } catch (logError) {
                console.error('Error logging verification:', logError);
                // Continue anyway - logging failure shouldn't block verification
            }
            
            // Return verified certificate data
            return res.status(200).json({
                verified: true,
                certificate: {
                    id: certificate.id,
                    serial: certificate.serial,
                    certificateLevel: certificate.certificateLevel,
                    certificateName: certificate.certificateName,
                    department: certificate.department,
                    major: certificate.major,
                    session: certificate.session,
                    rollNumber: certificate.rollNumber,
                    cgpa: certificate.cgpa,
                    degreeClass: certificate.degreeClass,
                    issueDate: certificate.issueDate,
                    convocationDate: certificate.convocationDate,
                    authorityName: certificate.authorityName,
                    authorityTitle: certificate.authorityTitle,
                    studentName: certificate.studentFullName,
                    studentDOB: certificate.studentDOB,
                    institutionName: certificate.institutionName,
                    institutionRegistration: certificate.institutionRegistration
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Verification failed: ${error.message}`
        });
    }
}

module.exports = {
    verifyCertificate
};

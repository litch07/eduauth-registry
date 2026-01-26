/**
 * Save verification when verifier verifies a certificate
 * Stores in VerifierVerificationHistory table for tracking
 * 
 * @async
 * @param {Object} req - Express request object with certificateId and serial
 * @param {Object} res - Express response object
 */
async function saveVerification(req, res) {
    let connection;
    try {
        const userId = req.user.userId;
        const { certificateId, serial } = req.body;

        if (!certificateId && !serial) {
            return res.status(400).json({
                error: 'Certificate ID or serial is required'
            });
        }

        connection = await pool.getConnection();

        // Get verifier ID
        const [verifiers] = await connection.execute(
            'SELECT id FROM Verifiers WHERE userId = ?',
            [userId]
        );

        if (verifiers.length === 0) {
            return res.status(404).json({
                error: 'Verifier profile not found'
            });
        }

        const verifierId = verifiers[0].id;

        // Check if certificate exists and get details
        const [certificates] = await connection.execute(
            `SELECT 
                c.id,
                c.serial,
                c.certificateName,
                c.certificateLevel,
                CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                i.name AS institutionName
             FROM Certificate c
             JOIN Student s ON c.studentId = s.id
             JOIN Institution i ON c.institutionId = i.id
             WHERE (c.id = ? OR c.serial = ?) AND c.deletedAt IS NULL`,
            [certificateId || null, serial || null]
        );

        if (certificates.length === 0) {
            return res.status(404).json({
                error: 'Certificate not found'
            });
        }

        const certificate = certificates[0];

        // Insert verification record
        const verificationId = uuidv4();
        await connection.execute(
            `INSERT INTO VerifierVerificationHistory 
             (id, verifierId, certificateId, verifiedAt) 
             VALUES (?, ?, ?, NOW())`,
            [verificationId, verifierId, certificate.id]
        );

        // Log activity
        await logActivity(
            verifierId,
            'VERIFIER',
            'CERTIFICATE_VERIFIED',
            'CERTIFICATE',
            certificate.id,
            { serial: certificate.serial, certificateName: certificate.certificateName }
        );

        return res.status(200).json({
            message: 'Verification saved successfully',
            certificate
        });
    } catch (error) {
        console.error('Error saving verification:', error);
        return res.status(500).json({
            error: `Failed to save verification: ${error.message}`
        });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get verification history for the logged-in verifier
 * Returns paginated list of certificates they have verified
 * 
 * @async
 * @param {Object} req - Express request object with pagination params
 * @param {Object} res - Express response object
 */
async function getVerificationHistory(req, res) {
    let connection;
    try {
        const userId = req.user.userId;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
        const offset = (page - 1) * limit;

        connection = await pool.getConnection();

        // Get verifier ID
        const [verifiers] = await connection.execute(
            'SELECT id FROM Verifiers WHERE userId = ?',
            [userId]
        );

        if (verifiers.length === 0) {
            return res.status(404).json({
                error: 'Verifier profile not found'
            });
        }

        const verifierId = verifiers[0].id;

        // Get verification history
        const [verifications] = await connection.execute(
            `SELECT 
                v.id,
                v.verifiedAt,
                c.serial,
                c.certificateName,
                c.certificateLevel,
                c.issueDate,
                CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                i.name AS institutionName
             FROM VerifierVerificationHistory v
             JOIN Certificate c ON v.certificateId = c.id
             JOIN Student s ON c.studentId = s.id
             JOIN Institution i ON c.institutionId = i.id
             WHERE v.verifierId = ?
             ORDER BY v.verifiedAt DESC
             LIMIT ? OFFSET ?`,
            [verifierId, limit, offset]
        );

        // Get total count
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM VerifierVerificationHistory WHERE verifierId = ?',
            [verifierId]
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            verifications,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching verification history:', error);
        return res.status(500).json({
            error: `Failed to fetch verification history: ${error.message}`
        });
    } finally {
        if (connection) connection.release();
    }
}

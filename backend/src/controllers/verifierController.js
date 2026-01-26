const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { sendCertificateRequestEmail } = require('../config/email');

// Configuration constants
const REQUEST_EXPIRY_DAYS = 7;
const ACCESS_EXPIRY_ALL_CERTS_DAYS = 30;
const ACCESS_EXPIRY_SINGLE_CERT_DAYS = 7;
const DAILY_REQUEST_LIMIT = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Get verifier dashboard with statistics and recent requests
 * Shows request counts and recent activity
 * Optimized: Consolidated multiple COUNT queries into single query
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getDashboard(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await pool.getConnection();

        try {
            // Get verifier ID
            const [verifiers] = await connection.execute(
                'SELECT id, companyName, isApproved FROM Verifiers WHERE userId = ?',
                [userId]
            );

            if (verifiers.length === 0) {
                return res.status(404).json({
                    error: 'Verifier profile not found'
                });
            }

            const verifierId = verifiers[0].id;
            const isApproved = !!verifiers[0].isApproved;
            const verifierInfo = {
                companyName: verifiers[0].companyName,
                isApproved,
                isVerified: isApproved
            };

            // Optimized: Get all counts in a single query
            const [stats] = await connection.execute(
                `SELECT 
                    COUNT(*) as totalRequests,
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingRequests,
                    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approvedRequests
                FROM CertificateRequests 
                WHERE verifierId = ?`,
                [verifierId]
            );

            // Get active access count separately (different table)
            const [activeAccessCount] = await connection.execute(
                'SELECT COUNT(*) as count FROM VerifierAccess WHERE verifierId = ? AND expiresAt > NOW() AND revokedAt IS NULL',
                [verifierId]
            );

            // Get recent 10 requests
            const [recentRequests] = await connection.execute(
                `SELECT 
                    r.id, r.requestType, r.purpose, r.status, r.createdAt,
                    CONCAT(s.firstName, ' ', s.lastName) AS studentName
                FROM CertificateRequests r
                JOIN Student s ON r.studentId = s.id
                WHERE r.verifierId = ?
                ORDER BY r.createdAt DESC
                LIMIT 10`,
                [verifierId]
            );

            // Get recent 5 verifications
            const [recentVerifications] = await connection.execute(
                `SELECT 
                    v.id,
                    c.serial AS serialNumber,
                    c.certificateName,
                    CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                    v.verifiedAt
                FROM VerifierVerificationHistory v
                JOIN Certificate c ON v.certificateId = c.id
                JOIN Student s ON c.studentId = s.id
                WHERE v.verifierId = ?
                ORDER BY v.verifiedAt DESC
                LIMIT 5`,
                [verifierId]
            );

            return res.status(200).json({
                totalRequests: stats[0].totalRequests || 0,
                pendingRequests: stats[0].pendingRequests || 0,
                approvedRequests: stats[0].approvedRequests || 0,
                activeAccess: activeAccessCount[0].count,
                recentRequests,
                recentVerifications,
                verifierInfo,
                isApproved: verifierInfo.isApproved,
                isVerified: verifierInfo.isApproved
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch dashboard: ${error.message}`
        });
    }
}

/**
 * Search for a student to request certificates from
 * Uses NID and Date of Birth for privacy-preserving lookup
 * 
 * @async
 * @param {Object} req - Express request object (query: nid, dateOfBirth)
 * @param {Object} res - Express response object
 */
async function searchStudent(req, res) {
    try {
        const userId = req.user.userId;
        const { nid, dateOfBirth } = req.query;

        // Validate required fields
        if (!nid || !dateOfBirth) {
            return res.status(400).json({
                error: 'NID and Date of Birth are required'
            });
        }

        // Get verifier ID
        const connection = await pool.getConnection();

        try {
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

            // Convert dateOfBirth from DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = dateOfBirth.split('/');
            const formattedDate = `${year}-${month}-${day}`;

            // Search for student
            const [students] = await connection.execute(
                `SELECT 
                    s.id, s.firstName, s.lastName, s.dateOfBirth,
                    (SELECT COUNT(*) FROM Certificate WHERE studentId = s.id) AS certificateCount
                FROM Student s
                WHERE s.nid = ? AND DATE(s.dateOfBirth) = ?`,
                [nid, formattedDate]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student not found with provided details'
                });
            }

            const student = students[0];

            // Check for pending request from this verifier
            const [pendingRequests] = await connection.execute(
                `SELECT id FROM CertificateRequests 
                WHERE verifierId = ? AND studentId = ? AND status = 'PENDING'`,
                [verifierId, student.id]
            );

            return res.status(200).json({
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    certificateCount: student.certificateCount
                },
                hasPendingRequest: pendingRequests.length > 0
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to search student: ${error.message}`
        });
    }
}

/**
 * Request access to all certificates of a student
 * Requires verifier approval and student approval
 * 
 * @async
 * @param {Object} req - Express request object (req.body: studentId, purpose, reason)
 * @param {Object} res - Express response object
 */
async function requestAllCertificates(req, res) {
    try {
        const userId = req.user.userId;
        const { studentId, purpose, reason } = req.body;

        // Validate required fields
        if (!studentId || !purpose || !reason) {
            return res.status(400).json({
                error: 'Missing required fields: studentId, purpose, reason'
            });
        }

        // Validate purpose
        const validPurposes = ['Employment', 'Admission', 'Background Check', 'Other'];
        if (!validPurposes.includes(purpose)) {
            return res.status(400).json({
                error: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`
            });
        }

        const connection = await pool.getConnection();

        try {
            // Get verifier ID
            const [verifiers] = await connection.execute(
                'SELECT id, isApproved FROM Verifiers WHERE userId = ?',
                [userId]
            );

            if (verifiers.length === 0) {
                return res.status(404).json({
                    error: 'Verifier profile not found'
                });
            }

            const verifier = verifiers[0];

            // Check if verifier is approved
            if (!verifier.isApproved) {
                return res.status(403).json({
                    error: 'Your account must be approved by admin first'
                });
            }

            // Check for existing pending request
            const [existingRequests] = await connection.execute(
                `SELECT id FROM CertificateRequests 
                WHERE verifierId = ? AND studentId = ? AND requestType = ? AND status = 'PENDING'`,
                [verifier.id, studentId, 'ALL_CERTIFICATES']
            );

            if (existingRequests.length > 0) {
                return res.status(400).json({
                    error: 'You already have a pending request for this student'
                });
            }

            // Check rate limit (max requests per day)
            const [dailyCount] = await connection.execute(
                `SELECT COUNT(*) as count FROM CertificateRequests 
                WHERE verifierId = ? AND DATE(createdAt) = CURDATE()`,
                [verifier.id]
            );

            if (dailyCount[0].count >= DAILY_REQUEST_LIMIT) {
                return res.status(429).json({
                    error: `Daily request limit (${DAILY_REQUEST_LIMIT}) exceeded. Try again tomorrow.`
                });
            }

            // Create request
            const requestId = uuidv4();
            const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_DAYS * MS_PER_DAY);

            await connection.execute(
                `INSERT INTO CertificateRequests 
                (id, requestType, verifierId, studentId, purpose, reason, status, expiresAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [requestId, 'ALL_CERTIFICATES', verifier.id, studentId, purpose, reason, 'PENDING', expiresAt]
            );

            // Get student email for notification
            const [studentUsers] = await connection.execute(
                `SELECT u.email FROM Users u 
                JOIN Student s ON u.id = s.userId 
                WHERE s.id = ?`,
                [studentId]
            );

            // Log activity
            await logActivity(
                userId,
                'VERIFIER',
                'REQUEST_CERTIFICATES',
                'CERTIFICATE_REQUEST',
                requestId,
                {
                    studentId,
                    requestType: 'ALL_CERTIFICATES',
                    purpose
                },
                req.ip
            );

            try {
                const [verifierRows] = await connection.execute(
                    'SELECT companyName FROM Verifiers WHERE id = ?',
                    [verifier.id]
                );
                const studentEmail = studentUsers[0]?.email;
                const companyName = verifierRows[0]?.companyName || 'Verifier';
                if (studentEmail) {
                    await sendCertificateRequestEmail(studentEmail, {
                        companyName,
                        purpose,
                        reason,
                        requestType: 'ALL_CERTIFICATES',
                        certificateSerial: null
                    });
                }
            } catch (emailError) {
                console.warn('Failed to send certificate request email:', emailError);
            }

            return res.status(201).json({
                message: 'Request sent successfully. The student will be notified.',
                requestId
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to request certificates: ${error.message}`
        });
    }
}

/**
 * Request access to a single certificate
 * Similar to requestAllCertificates but for specific certificate
 * 
 * @async
 * @param {Object} req - Express request object (req.body: studentId, certificateId, purpose, reason)
 * @param {Object} res - Express response object
 */
async function requestSingleCertificate(req, res) {
    try {
        const userId = req.user.userId;
        let { studentId, certificateId, serial, purpose, reason } = req.body;

        // Validate required fields
        if ((!studentId && !serial) || (!certificateId && !serial) || !purpose || !reason) {
            return res.status(400).json({
                error: 'Missing required fields: certificateId or serial, purpose, reason'
            });
        }

        // Validate purpose
        const validPurposes = ['Employment', 'Admission', 'Background Check', 'Other'];
        if (!validPurposes.includes(purpose)) {
            return res.status(400).json({
                error: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`
            });
        }

        const connection = await pool.getConnection();

        try {
            // Get verifier ID
            const [verifiers] = await connection.execute(
                'SELECT id, isApproved FROM Verifiers WHERE userId = ?',
                [userId]
            );

            if (verifiers.length === 0) {
                return res.status(404).json({
                    error: 'Verifier profile not found'
                });
            }

            const verifier = verifiers[0];

            // Check if verifier is approved
            if (!verifier.isApproved) {
                return res.status(403).json({
                    error: 'Your account must be approved by admin first'
                });
            }

            if (!certificateId || !studentId) {
                const [certificates] = await connection.execute(
                    'SELECT id, studentId FROM Certificate WHERE serial = ? AND deletedAt IS NULL',
                    [serial?.toUpperCase() || null]
                );

                if (certificates.length === 0) {
                    return res.status(404).json({
                        error: 'Certificate not found'
                    });
                }

                certificateId = certificates[0].id;
                studentId = certificates[0].studentId;
            } else {
                const [certificates] = await connection.execute(
                    'SELECT id FROM Certificate WHERE id = ? AND studentId = ?',
                    [certificateId, studentId]
                );

                if (certificates.length === 0) {
                    return res.status(404).json({
                        error: 'Certificate not found or does not belong to student'
                    });
                }
            }

            // Check for existing pending request
            const [existingRequests] = await connection.execute(
                `SELECT id FROM CertificateRequests 
                WHERE verifierId = ? AND studentId = ? AND certificateId = ? AND status = 'PENDING'`,
                [verifier.id, studentId, certificateId]
            );

            if (existingRequests.length > 0) {
                return res.status(400).json({
                    error: 'You already have a pending request for this certificate'
                });
            }

            // Create request
            const requestId = uuidv4();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await connection.execute(
                `INSERT INTO CertificateRequests 
                (id, requestType, verifierId, studentId, certificateId, purpose, reason, status, expiresAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [requestId, 'SINGLE_CERTIFICATE', verifier.id, studentId, certificateId, purpose, reason, 'PENDING', expiresAt]
            );

            // Log activity
            await logActivity(
                userId,
                'VERIFIER',
                'REQUEST_CERTIFICATE',
                'CERTIFICATE_REQUEST',
                requestId,
                {
                    studentId,
                    certificateId,
                    requestType: 'SINGLE_CERTIFICATE',
                    purpose
                },
                req.ip
            );

            try {
                const [studentRows] = await connection.execute(
                    'SELECT u.email FROM Student s JOIN Users u ON s.userId = u.id WHERE s.id = ?',
                    [studentId]
                );
                const [verifierRows] = await connection.execute(
                    'SELECT companyName FROM Verifiers WHERE id = ?',
                    [verifier.id]
                );
                const [certificateRows] = await connection.execute(
                    'SELECT serial FROM Certificate WHERE id = ?',
                    [certificateId]
                );
                const studentEmail = studentRows[0]?.email;
                const companyName = verifierRows[0]?.companyName || 'Verifier';
                const certificateSerial = certificateRows[0]?.serial || null;
                if (studentEmail) {
                    await sendCertificateRequestEmail(studentEmail, {
                        companyName,
                        purpose,
                        reason,
                        requestType: 'SINGLE_CERTIFICATE',
                        certificateSerial
                    });
                }
            } catch (emailError) {
                console.warn('Failed to send certificate request email:', emailError);
            }

            return res.status(201).json({
                message: 'Certificate request sent successfully. The student will be notified.',
                requestId
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to request certificate: ${error.message}`
        });
    }
}

/**
 * Get verifier's certificate requests with filtering and pagination
 * Returns all requests with status filtering
 * 
 * @async
 * @param {Object} req - Express request object (query: status, page, limit)
 * @param {Object} res - Express response object
 */
async function getMyRequests(req, res) {
    try {
        const userId = req.user.userId;
        const { status, page = 1, limit = 20 } = req.query;

        const connection = await pool.getConnection();

        try {
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
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            // Build query with optional status filter
            let query = `SELECT 
                r.id, r.requestType, r.purpose, r.reason, r.status, r.createdAt, r.expiresAt,
                r.approvedAt, r.rejectedAt, r.rejectionReason,
                s.id AS studentId,
                CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                c.serial AS certificateSerial
            FROM CertificateRequests r
            JOIN Student s ON r.studentId = s.id
            LEFT JOIN Certificate c ON r.certificateId = c.id
            WHERE r.verifierId = ?`;

            const params = [verifierId];

            if (status) {
                query += ' AND r.status = ?';
                params.push(status);
            }

            query += ' ORDER BY r.createdAt DESC LIMIT ? OFFSET ?';
            params.push(limitNum, offset);

            // Get requests
            const [requests] = await connection.execute(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as count FROM CertificateRequests WHERE verifierId = ?';
            const countParams = [verifierId];

            if (status) {
                countQuery += ' AND status = ?';
                countParams.push(status);
            }

            const [totalCount] = await connection.execute(countQuery, countParams);

            const totalPages = Math.ceil(totalCount[0].count / limitNum);

            return res.status(200).json({
                requests,
                total: totalCount[0].count,
                page: pageNum,
                totalPages
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch requests: ${error.message}`
        });
    }
}

/**
 * Get active access grants for verifier
 * Shows what student certificates verifier currently has access to
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getActiveAccess(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await pool.getConnection();

        try {
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

            // Get active access grants
            const [activeAccess] = await connection.execute(
                `SELECT 
                    a.id, a.grantedAt, a.expiresAt, a.certificateId,
                    s.id AS studentId,
                    CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                    c.serial AS certificateSerial
                FROM VerifierAccess a
                JOIN Student s ON a.studentId = s.id
                LEFT JOIN Certificate c ON a.certificateId = c.id
                WHERE a.verifierId = ? AND a.expiresAt > NOW() AND a.revokedAt IS NULL
                ORDER BY a.expiresAt ASC`,
                [verifierId]
            );

            return res.status(200).json({
                activeAccess
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch active access: ${error.message}`
        });
    }
}

/**
 * View accessed certificates for a student
 * Returns certificates verifier has access to
 * 
 * @async
 * @param {Object} req - Express request object (params: studentId)
 * @param {Object} res - Express response object
 */
async function viewAccessedCertificates(req, res) {
    try {
        const userId = req.user.userId;
        const { studentId } = req.params;

        const connection = await pool.getConnection();

        try {
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

            // Check if verifier has active access
            const [accessGrants] = await connection.execute(
                `SELECT a.id, a.certificateId, a.expiresAt FROM VerifierAccess a
                WHERE a.verifierId = ? AND a.studentId = ? AND a.expiresAt > NOW() AND a.revokedAt IS NULL`,
                [verifierId, studentId]
            );

            if (accessGrants.length === 0) {
                return res.status(403).json({
                    error: 'You do not have access to this student\'s certificates'
                });
            }

            const access = accessGrants[0];
            let certificates;

            if (access.certificateId) {
                // Access is limited to specific certificate
                const [certs] = await connection.execute(
                    `SELECT 
                        id,
                        serial,
                        certificateLevel,
                        certificateName,
                        department,
                        major,
                        session,
                        rollNumber,
                        cgpa,
                        degreeClass,
                        issueDate,
                        convocationDate,
                        authorityName,
                        authorityTitle,
                        isPubliclyShareable,
                        studentFullName,
                        studentDOB,
                        studentId,
                        institutionName,
                        institutionRegistration
                    FROM vw_certificates_full
                    WHERE id = ? AND studentId = ?`,
                    [access.certificateId, studentId]
                );
                certificates = certs;
            } else {
                // Access is to all public certificates
                const [certs] = await connection.execute(
                    `SELECT 
                        id,
                        serial,
                        certificateLevel,
                        certificateName,
                        department,
                        major,
                        session,
                        rollNumber,
                        cgpa,
                        degreeClass,
                        issueDate,
                        convocationDate,
                        authorityName,
                        authorityTitle,
                        isPubliclyShareable,
                        studentFullName,
                        studentDOB,
                        studentId,
                        institutionName,
                        institutionRegistration
                    FROM vw_certificates_full
                    WHERE studentId = ? AND isPubliclyShareable = TRUE
                    ORDER BY issueDate DESC`,
                    [studentId]
                );
                certificates = certs;
            }

            // Log access in activity log
            await logActivity(
                userId,
                'VERIFIER',
                'VIEW_CERTIFICATES',
                'CERTIFICATE',
                studentId,
                {
                    certificateCount: certificates.length,
                    accessType: access.certificateId ? 'SPECIFIC' : 'ALL_PUBLIC'
                },
                req.ip
            );

            return res.status(200).json({
                certificates,
                accessExpiresAt: access.expiresAt
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch certificates: ${error.message}`
        });
    }
}

/**
 * Get verifier profile information
 */
async function getProfile(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.execute(
                `SELECT 
                    v.id,
                    v.companyName,
                    v.companyRegistration,
                    v.website,
                    v.purpose,
                    v.contactPhone,
                    v.isApproved,
                    v.isApproved AS isVerified,
                    DATE_FORMAT(v.createdAt, '%d/%m/%Y') AS createdAt,
                    DATE_FORMAT(v.approvedAt, '%d/%m/%Y') AS approvedAt,
                    u.email
                 FROM Verifiers v
                 JOIN Users u ON v.userId = u.id
                 WHERE v.userId = ?`,
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Verifier profile not found' });
            }

            return res.status(200).json(rows[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({ error: `Failed to fetch profile: ${error.message}` });
    }
}

/**
 * Save verification history for a verifier
 */
async function saveVerification(req, res) {
    let connection;
    try {
        const userId = req.user.userId;
        const { certificateId, serial } = req.body || {};

        if (!certificateId && !serial) {
            return res.status(400).json({ error: 'Certificate ID or serial is required' });
        }

        connection = await pool.getConnection();

        const [verifiers] = await connection.execute(
            'SELECT id FROM Verifiers WHERE userId = ?',
            [userId]
        );

        if (verifiers.length === 0) {
            return res.status(404).json({ error: 'Verifier profile not found' });
        }

        const verifierId = verifiers[0].id;

        const [certificates] = await connection.execute(
            `SELECT id, serial, certificateName
             FROM Certificate
             WHERE (id = ? OR serial = ?) AND deletedAt IS NULL`,
            [certificateId || null, serial?.toUpperCase() || null]
        );

        if (certificates.length === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        const certificate = certificates[0];
        const verificationId = uuidv4();

        await connection.execute(
            `INSERT INTO VerifierVerificationHistory 
             (id, verifierId, certificateId, verifiedAt) 
             VALUES (?, ?, ?, NOW())`,
            [verificationId, verifierId, certificate.id]
        );

        await logActivity(
            userId,
            'VERIFIER',
            'CERTIFICATE_VERIFIED',
            'CERTIFICATE',
            certificate.id,
            { serial: certificate.serial, certificateName: certificate.certificateName },
            req.ip
        );

        return res.status(200).json({ message: 'Verification saved successfully' });
    } catch (error) {
        return res.status(500).json({ error: `Failed to save verification: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get verification history for the logged-in verifier
 */
async function getVerificationHistory(req, res) {
    let connection;
    try {
        const userId = req.user.userId;
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
        const offset = (page - 1) * limit;
        const { serial, dateFrom, dateTo, level } = req.query;

        const levelMap = {
            Bachelor: 'BACHELOR',
            Master: 'MASTER',
            Doctorate: 'DOCTORATE'
        };

        connection = await pool.getConnection();

        const [verifiers] = await connection.execute(
            'SELECT id FROM Verifiers WHERE userId = ?',
            [userId]
        );

        if (verifiers.length === 0) {
            return res.status(404).json({ error: 'Verifier profile not found' });
        }

        const verifierId = verifiers[0].id;

        let whereClause = 'WHERE v.verifierId = ?';
        const params = [verifierId];

        if (serial) {
            whereClause += ' AND c.serial LIKE ?';
            params.push(`%${serial.toUpperCase()}%`);
        }

        if (dateFrom) {
            whereClause += ' AND DATE(v.verifiedAt) >= ?';
            params.push(dateFrom);
        }

        if (dateTo) {
            whereClause += ' AND DATE(v.verifiedAt) <= ?';
            params.push(dateTo);
        }

        const normalizedLevel = levelMap[level] || null;
        if (normalizedLevel) {
            whereClause += ' AND c.certificateLevel = ?';
            params.push(normalizedLevel);
        }

        const [verifications] = await connection.execute(
            `SELECT 
                v.id,
                v.verifiedAt,
                c.serial,
                c.certificateName,
                c.certificateLevel,
                DATE_FORMAT(c.issueDate, '%d/%m/%Y') AS issuedAt,
                s.firstName AS studentFirstName,
                s.lastName AS studentLastName,
                s.nid AS studentNid,
                DATE_FORMAT(s.dateOfBirth, '%d/%m/%Y') AS studentDOB,
                u.email AS studentEmail,
                i.name AS institutionName
             FROM VerifierVerificationHistory v
             JOIN Certificate c ON v.certificateId = c.id
             JOIN Student s ON c.studentId = s.id
             JOIN Users u ON s.userId = u.id
             JOIN Institution i ON c.institutionId = i.id
             ${whereClause}
             ORDER BY v.verifiedAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [countResult] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM VerifierVerificationHistory v
             JOIN Certificate c ON v.certificateId = c.id
             ${whereClause}`,
            params
        );

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        const levelLabels = {
            BACHELOR: 'Bachelor',
            MASTER: 'Master',
            DOCTORATE: 'Doctorate'
        };

        const formatted = verifications.map((row) => ({
            id: row.id,
            verifiedAt: row.verifiedAt,
            certificate: {
                serialNumber: row.serial,
                certificateName: row.certificateName,
                level: levelLabels[row.certificateLevel] || row.certificateLevel,
                issuedAt: row.issuedAt,
                student: {
                    firstName: row.studentFirstName,
                    lastName: row.studentLastName,
                    nid: row.studentNid,
                    dateOfBirth: row.studentDOB,
                    email: row.studentEmail
                },
                institution: {
                    name: row.institutionName
                }
            }
        }));

        return res.status(200).json({
            verifications: formatted,
            page,
            total,
            totalPages
        });
    } catch (error) {
        return res.status(500).json({ error: `Failed to fetch verification history: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    getDashboard,
    searchStudent,
    requestAllCertificates,
    requestSingleCertificate,
    getMyRequests,
    getActiveAccess,
    viewAccessedCertificates,
    getProfile,
    saveVerification,
    getVerificationHistory
};

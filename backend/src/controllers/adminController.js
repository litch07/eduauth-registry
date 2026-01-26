const pool = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { sendEmail } = require('../utils/emailService');
const { sendApprovalEmail } = require('../config/email');

/**
 * Get admin dashboard statistics
 * Returns system-wide counts: students, institutions, certificates, pending verifications
 * 
 * @async
 * @param {Object} req - Express request object (admin user verified by middleware)
 * @param {Object} res - Express response object
 */
async function getDashboard(req, res) {
    let connection;
    try {
        connection = await pool.getConnection();

        // Get all dashboard statistics from view (single query replaces 8+ COUNT queries)
        const [stats] = await connection.execute(
            'SELECT * FROM vw_system_stats'
        );

        if (stats.length === 0) {
            return res.status(500).json({
                error: 'Failed to fetch system statistics'
            });
        }

        const {
            totalStudents,
            totalUniversities,
            totalVerifiers,
            totalCertificates,
            todayCertificates,
            todayVerifications,
            totalVerifications,
            pendingCertRequests,
            pendingVerifiers,
            pendingApprovals,
            newUsersThisWeek
        } = stats[0];

        const [todayCertRows] = await connection.execute(
            'SELECT COUNT(*) AS count FROM Certificate WHERE deletedAt IS NULL AND DATE(issueDate) = CURDATE()'
        );
        const todayCertificatesCount = todayCertRows[0]?.count ?? todayCertificates;

        return res.status(200).json({
            totalStudents,
            totalUniversities,
            totalVerifiers,
            totalCertificates,
            todayCertificates: todayCertificatesCount,
            todayVerifications,
            totalVerifications,
            pendingCertRequests,
            pendingVerifiers,
            pendingApprovals,
            newUsersThisWeek
        });
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        return res.status(500).json({
            error: `Failed to fetch dashboard: ${error.message}`
        });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get admin profile information
 *
 * @async
 * @param {Object} req
 * @param {Object} res
 */
async function getProfile(req, res) {
    let connection;
    try {
        const adminId = req.user.userId;
        connection = await pool.getConnection();

        const [admins] = await connection.execute(
            `SELECT 
                id,
                name,
                email,
                DATE_FORMAT(createdAt, '%d/%m/%Y') AS createdAt
             FROM Admins
             WHERE id = ?`,
            [adminId]
        );

        if (admins.length === 0) {
            return res.status(404).json({ error: 'Admin profile not found' });
        }

        return res.status(200).json(admins[0]);
    } catch (error) {
        return res.status(500).json({ error: `Failed to fetch profile: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get all system users with optional filtering
 * 
 * Query parameters:
 * - role: Filter by role (STUDENT, UNIVERSITY)
 * - emailVerified: Filter by email verification status (true, false)
 * 
 * @async
 * @param {Object} req - Express request object with query filters
 * @param {Object} res - Express response object
 */
async function getAllUsers(req, res) {
    let connection;
    try {
        const { role, emailVerified } = req.query;

        connection = await pool.getConnection();

        // Build WHERE clause based on filters
        let whereConditions = [];
        let params = [];

        if (role) {
            whereConditions.push('u.role = ?');
            params.push(role.toUpperCase());
        }

        if (emailVerified !== undefined) {
            const isVerified = emailVerified === 'true' || emailVerified === '1';
            whereConditions.push('u.emailVerified = ?');
            params.push(isVerified);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Fetch users with filters
        const query = `
            SELECT 
                u.id,
                u.email,
                u.role,
                u.emailVerified,
                DATE_FORMAT(u.createdAt, '%d/%m/%Y %H:%i') as createdAt
            FROM Users u
            ${whereClause}
            ORDER BY u.createdAt DESC
        `;

        const [users] = await connection.execute(query, params);

        return res.status(200).json({
            users,
            count: users.length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            error: `Failed to fetch users: ${error.message}`
        });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get verification analytics
 * Includes: total verifications, verifications by country, most verified certificates
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getVerificationAnalytics(req, res) {
    let connection;
    try {
        connection = await pool.getConnection();

        // Total verifications
        const [totalVerifications] = await connection.execute(
            'SELECT COUNT(*) as count FROM VerificationLog'
        );

        // Verifications by country (top 10)
        const [verificationsByCountry] = await connection.execute(
            `SELECT 
                verifierCountry as country,
                COUNT(*) as count
             FROM VerificationLog
             WHERE verifierCountry IS NOT NULL
             GROUP BY verifierCountry
             ORDER BY count DESC
             LIMIT 10`
        );

        // Most verified certificates (top 10) - using pre-aggregated view
        const [mostVerified] = await connection.execute(
            `SELECT 
                serial,
                certificateName,
                institutionName,
                totalVerifications as verificationCount,
                lastVerifiedAt
             FROM vw_verification_stats
             ORDER BY totalVerifications DESC
             LIMIT 10`
        );

        return res.status(200).json({
            totalVerifications: totalVerifications[0].count,
            verificationsByCountry,
            mostVerifiedCertificates: mostVerified
        });
    } catch (error) {
        console.error('Error fetching verification analytics:', error);
        return res.status(500).json({
            error: `Failed to fetch analytics: ${error.message}`
        });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get certificates with filters
 *
 * Query parameters:
 * - q: search term (serial, student name, student ID)
 * - today: "1" to only return today's certificates
 * - limit: max items (default 10, max 100)
 * - page: page number (default 1)
 */
async function getCertificates(req, res) {
    let connection;
    try {
        const q = (req.query.q || '').trim();
        const today = req.query.today === '1';
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const offset = (page - 1) * limit;

        const where = ['c.deletedAt IS NULL'];
        const params = [];

        if (today) {
            where.push('DATE(c.issueDate) = CURDATE()');
        }

        if (q) {
            const like = `%${q}%`;
            where.push(`(
                c.serial LIKE ?
                OR s.firstName LIKE ?
                OR s.lastName LIKE ?
                OR s.studentId LIKE ?
            )`);
            params.push(like, like, like, like);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

        connection = await pool.getConnection();

        const [countRows] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM Certificate c
             JOIN Student s ON c.studentId = s.id
             ${whereClause}`,
            params
        );
        const total = countRows[0]?.total || 0;

        const [certificates] = await connection.execute(
            `SELECT
                c.id,
                c.serial,
                c.certificateLevel,
                c.certificateName,
                c.department,
                c.major,
                c.session,
                c.cgpa,
                c.degreeClass,
                DATE_FORMAT(c.issueDate, '%d/%m/%Y') AS issueDate,
                DATE_FORMAT(c.convocationDate, '%d/%m/%Y') AS convocationDate,
                c.authorityName,
                c.authorityTitle,
                c.isPubliclyShareable,
                s.id AS studentId,
                CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                s.studentId AS studentSystemId,
                i.id AS institutionId,
                i.name AS institutionName,
                e.studentInstitutionId AS rollNumber
             FROM Certificate c
             JOIN Student s ON c.studentId = s.id
             JOIN Institution i ON c.institutionId = i.id
             LEFT JOIN Enrollment e
               ON e.studentId = s.id
              AND e.institutionId = i.id
              AND e.deletedAt IS NULL
             ${whereClause}
             ORDER BY c.issueDate DESC, c.createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.status(200).json({
            certificates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        return res.status(500).json({ error: `Failed to fetch certificates: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Revoke (soft delete) a certificate
 */
async function revokeCertificate(req, res) {
    let connection;
    try {
        const certificateId = req.params.id;
        const adminId = req.user.userId;

        if (!certificateId) {
            return res.status(400).json({ error: 'Certificate id is required' });
        }

        connection = await pool.getConnection();

        const [result] = await connection.execute(
            `UPDATE Certificate
             SET deletedAt = NOW(), deletedBy = ?
             WHERE id = ? AND deletedAt IS NULL`,
            [adminId, certificateId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Certificate not found or already revoked' });
        }

        await logActivity(
            adminId,
            'ADMIN',
            'CERTIFICATE_REVOKED',
            'CERTIFICATE',
            certificateId,
            null,
            req.ip
        );

        return res.status(200).json({ message: 'Certificate revoked successfully' });
    } catch (error) {
        console.error('Error revoking certificate:', error);
        return res.status(500).json({ error: `Failed to revoke certificate: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get verification logs with optional date filter
 *
 * Query parameters:
 * - today: "1" to only return today's verifications
 * - q: search by certificate serial
 * - limit: max items (default 10, max 100)
 * - page: page number (default 1)
 */
async function getVerificationLogs(req, res) {
    let connection;
    try {
        const q = (req.query.q || '').trim();
        const today = req.query.today === '1';
        const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const offset = (page - 1) * limit;

        const where = [];
        const params = [];

        if (today) {
            where.push('DATE(v.verifiedAt) = CURDATE()');
        }

        if (q) {
            where.push('c.serial LIKE ?');
            params.push(`%${q}%`);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

        connection = await pool.getConnection();

        const [countRows] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM VerificationLog v
             JOIN Certificate c ON v.certificateId = c.id
             ${whereClause}`,
            params
        );
        const total = countRows[0]?.total || 0;

        const [logs] = await connection.execute(
            `SELECT
                v.id,
                c.serial,
                c.certificateName,
                DATE_FORMAT(v.verifiedAt, '%d/%m/%Y %H:%i') AS verifiedAt,
                v.verifierCountry,
                v.verifierIP,
                CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                i.name AS institutionName
             FROM VerificationLog v
             JOIN Certificate c ON v.certificateId = c.id
             JOIN Student s ON c.studentId = s.id
             JOIN Institution i ON c.institutionId = i.id
             ${whereClause}
             ORDER BY v.verifiedAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return res.status(200).json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching verification logs:', error);
        return res.status(500).json({ error: `Failed to fetch verification logs: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get activity logs with pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * 
 * @async
 * @param {Object} req - Express request object with pagination params
 * @param {Object} res - Express response object
 */
async function getActivityLogs(req, res) {
    let connection;
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
        const offset = (page - 1) * limit;
        const { actorType, action, dateFrom, dateTo } = req.query;

        connection = await pool.getConnection();

        const where = [];
        const params = [];

        if (actorType) {
            where.push('actorType = ?');
            params.push(actorType);
        }

        if (action) {
            where.push('action LIKE ?');
            params.push(`%${action}%`);
        }

        if (dateFrom) {
            where.push('DATE(createdAt) >= ?');
            params.push(dateFrom);
        }

        if (dateTo) {
            where.push('DATE(createdAt) <= ?');
            params.push(dateTo);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

        // Count total activity logs
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM ActivityLog ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Fetch paginated logs
        const [logs] = await connection.execute(
            `SELECT 
                id,
                actorId,
                actorType,
                action,
                targetType,
                targetId,
                details,
                ipAddress,
                DATE_FORMAT(createdAt, '%d/%m/%Y %H:%i:%s') as createdAt
             FROM ActivityLog
             ${whereClause}
             ORDER BY createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return res.status(500).json({
            error: `Failed to fetch activity logs: ${error.message}`
        });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get pending verifiers awaiting admin approval
 */
async function getPendingVerifiers(req, res) {
    let connection;
    try {
        connection = await pool.getConnection();

        const [pendingVerifiers] = await connection.execute(
            `SELECT 
                v.id, v.companyName, v.companyRegistration, v.website, v.purpose, v.contactPhone,
                v.isApproved AS isVerified,
                DATE_FORMAT(v.createdAt, '%d/%m/%Y %H:%i') as createdAt,
                u.email
             FROM Verifiers v
             JOIN Users u ON v.userId = u.id
             WHERE v.isApproved = FALSE AND v.rejectionReason IS NULL
             ORDER BY v.createdAt ASC`
        );

        return res.status(200).json({ pendingVerifiers });
    } catch (error) {
        console.error('Error fetching pending verifiers:', error);
        return res.status(500).json({ error: `Failed to fetch pending verifiers: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Approve a verifier
 */
async function approveVerifier(req, res) {
    let connection;
    try {
        const verifierId = req.params.verifierId || req.params.id;
        const adminId = req.user.userId;

        if (!verifierId) {
            return res.status(400).json({ error: 'verifierId is required' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Update verifier approval
        const [updateResult] = await connection.execute(
            `UPDATE Verifiers 
             SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ?
             WHERE id = ?`,
            [adminId, verifierId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Verifier not found' });
        }

        // Get verifier email
        const [rows] = await connection.execute(
            `SELECT u.email 
             FROM Users u 
             JOIN Verifiers v ON u.id = v.userId 
             WHERE v.id = ?`,
            [verifierId]
        );

        const verifierEmail = rows[0]?.email || null;

        // Log activity
        await logActivity(connection, {
            userId: adminId,
            action: 'APPROVE_VERIFIER',
            resourceType: 'VERIFIER',
            resourceId: verifierId,
            details: JSON.stringify({ email: verifierEmail })
        });

        await connection.commit();

        // Send approval email (post-commit)
        if (verifierEmail) {
            try {
                await sendApprovalEmail(verifierEmail, 'Verifier');
            } catch (emailErr) {
                console.warn('Failed to send approval email:', emailErr);
            }
        }

        return res.status(200).json({ message: 'Verifier approved successfully' });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (_) {}
        }
        console.error('Error approving verifier:', error);
        return res.status(500).json({ error: `Failed to approve verifier: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Reject a verifier with a reason
 */
async function rejectVerifier(req, res) {
    let connection;
    try {
        const verifierId = req.params.verifierId || req.params.id;
        const { rejectionReason } = req.body || {};
        const adminId = req.user.userId;

        if (!verifierId) {
            return res.status(400).json({ error: 'verifierId is required' });
        }
        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).json({ error: 'rejectionReason is required' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Update rejection reason
        const [updateResult] = await connection.execute(
            `UPDATE Verifiers 
             SET rejectionReason = ?
             WHERE id = ?`,
            [rejectionReason.trim(), verifierId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Verifier not found' });
        }

        // Get verifier email
        const [rows] = await connection.execute(
            `SELECT u.email 
             FROM Users u 
             JOIN Verifiers v ON u.id = v.userId 
             WHERE v.id = ?`,
            [verifierId]
        );
        const verifierEmail = rows[0]?.email || null;

        // Log activity
        await logActivity(connection, {
            userId: adminId,
            action: 'REJECT_VERIFIER',
            resourceType: 'VERIFIER',
            resourceId: verifierId,
            details: JSON.stringify({ email: verifierEmail, reason: rejectionReason.trim() })
        });

        await connection.commit();

        // Send rejection email (post-commit)
        if (verifierEmail) {
            try {
                await sendEmail(verifierEmail, 'Verifier Application Rejected',
                    `Your verifier application was rejected. Reason: ${rejectionReason.trim()}`);
            } catch (emailErr) {
                console.warn('Failed to send rejection email:', emailErr);
            }
        }

        return res.status(200).json({ message: 'Verifier rejected' });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (_) {}
        }
        console.error('Error rejecting verifier:', error);
        return res.status(500).json({ error: `Failed to reject verifier: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get all verifiers with optional verification status filter
 */
async function getAllVerifiers(req, res) {
    let connection;
    try {
        const filter = (req.query.isApproved || req.query.isVerified || 'all').toLowerCase();
        let whereClause = '';
        let params = [];

        if (filter === 'true' || filter === 'false') {
            const isApproved = filter === 'true';
            whereClause = 'WHERE v.isApproved = ?';
            params.push(isApproved);
        }

        connection = await pool.getConnection();

        const [verifiers] = await connection.execute(
            `SELECT 
                v.id, v.companyName, v.purpose, v.isApproved, v.isApproved AS isVerified, v.approvedAt,
                DATE_FORMAT(v.createdAt, '%d/%m/%Y %H:%i') as createdAt,
                u.email,
                (SELECT COUNT(*) FROM CertificateRequests WHERE verifierId = v.id) as totalRequests
             FROM Verifiers v
             JOIN Users u ON v.userId = u.id
             ${whereClause}
             ORDER BY v.createdAt DESC`,
            params
        );

        return res.status(200).json({ verifiers });
    } catch (error) {
        console.error('Error fetching verifiers:', error);
        return res.status(500).json({ error: `Failed to fetch verifiers: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
}

async function getPendingApprovals(req, res) {
    let connection;
    try {
        connection = await pool.getConnection();

        const [pendingStudents] = await connection.execute(
            `SELECT 
                s.id, s.firstName, s.lastName, s.nid,
                DATE_FORMAT(s.dateOfBirth, '%d/%m/%Y') as dateOfBirth,
                u.email, u.createdAt,
                'STUDENT' as userType
             FROM Student s
             JOIN Users u ON s.userId = u.id
             WHERE s.isApproved = FALSE AND u.emailVerified = TRUE AND s.deletedAt IS NULL
             ORDER BY u.createdAt DESC`
        );

        const [pendingUniversities] = await connection.execute(
            `SELECT 
                i.id, i.name, i.registrationNumber, i.address as city,
                u.email, u.createdAt,
                'UNIVERSITY' as userType
             FROM Institution i
             JOIN Users u ON i.userId = u.id
             WHERE i.isApproved = FALSE AND u.emailVerified = TRUE AND i.deletedAt IS NULL
             ORDER BY u.createdAt DESC`
        );

        const [pendingVerifiers] = await connection.execute(
            `SELECT 
                v.id, v.companyName, v.purpose, v.contactPhone,
                u.email, u.createdAt,
                'VERIFIER' as userType
             FROM Verifiers v
             JOIN Users u ON v.userId = u.id
             WHERE v.isApproved = FALSE AND u.emailVerified = TRUE AND v.deletedAt IS NULL
             ORDER BY u.createdAt DESC`
        );

        return res.status(200).json({
            pendingStudents,
            pendingUniversities,
            pendingVerifiers,
            totalPending: pendingStudents.length + pendingUniversities.length + pendingVerifiers.length
        });
    } catch (error) {
        console.error('Get pending approvals error:', error);
        return res.status(500).json({ error: 'Failed to fetch pending approvals' });
    } finally {
        if (connection) connection.release();
    }
}

async function approveUser(req, res) {
    let connection;
    try {
        const { userId, userType } = req.body;
        const adminId = req.user.userId;

        if (!userId || !userType) {
            return res.status(400).json({ error: 'userId and userType are required' });
        }

        connection = await pool.getConnection();

        let userEmail = null;
        const type = userType.toUpperCase();

        if (type === 'STUDENT') {
            await connection.execute(
                'UPDATE Student SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ? WHERE id = ?',
                [adminId, userId]
            );
            const [rows] = await connection.execute(
                'SELECT u.email FROM Student s JOIN Users u ON s.userId = u.id WHERE s.id = ?',
                [userId]
            );
            userEmail = rows[0]?.email || null;
        } else if (type === 'UNIVERSITY') {
            await connection.execute(
                'UPDATE Institution SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ? WHERE id = ?',
                [adminId, userId]
            );
            const [rows] = await connection.execute(
                'SELECT u.email FROM Institution i JOIN Users u ON i.userId = u.id WHERE i.id = ?',
                [userId]
            );
            userEmail = rows[0]?.email || null;
        } else if (type === 'VERIFIER') {
            await connection.execute(
                'UPDATE Verifiers SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ? WHERE id = ?',
                [adminId, userId]
            );
            const [rows] = await connection.execute(
                'SELECT u.email FROM Verifiers v JOIN Users u ON v.userId = u.id WHERE v.id = ?',
                [userId]
            );
            userEmail = rows[0]?.email || null;
        } else {
            return res.status(400).json({ error: 'Invalid userType' });
        }

        if (userEmail) {
            try {
                await sendApprovalEmail(userEmail, type);
            } catch (emailErr) {
                console.warn('Failed to send approval email:', emailErr);
            }
        }

        await logActivity(
            adminId,
            'ADMIN',
            'USER_APPROVED',
            type,
            userId,
            { userType: type, email: userEmail },
            req.ip
        );

        return res.status(200).json({ message: 'User approved successfully' });
    } catch (error) {
        console.error('Approve user error:', error);
        return res.status(500).json({ error: 'Failed to approve user' });
    } finally {
        if (connection) connection.release();
    }
}

async function rejectUser(req, res) {
    let connection;
    try {
        const { userId, userType, rejectionReason } = req.body;
        if (!userId || !userType || !rejectionReason) {
            return res.status(400).json({ error: 'userId, userType, and rejectionReason are required' });
        }

        connection = await pool.getConnection();
        const type = userType.toUpperCase();

        if (type === 'STUDENT') {
            await connection.execute(
                'UPDATE Student SET rejectionReason = ? WHERE id = ?',
                [rejectionReason, userId]
            );
        } else if (type === 'UNIVERSITY') {
            await connection.execute(
                'UPDATE Institution SET rejectionReason = ? WHERE id = ?',
                [rejectionReason, userId]
            );
        } else if (type === 'VERIFIER') {
            await connection.execute(
                'UPDATE Verifiers SET rejectionReason = ? WHERE id = ?',
                [rejectionReason, userId]
            );
        } else {
            return res.status(400).json({ error: 'Invalid userType' });
        }

        await logActivity(
            req.user.userId,
            'ADMIN',
            'USER_REJECTED',
            type,
            userId,
            { userType: type, rejectionReason },
            req.ip
        );

        return res.status(200).json({ message: 'User rejected' });
    } catch (error) {
        console.error('Reject user error:', error);
        return res.status(500).json({ error: 'Failed to reject user' });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    getDashboard,
    getProfile,
    getAllUsers,
    getVerificationAnalytics,
    getCertificates,
    revokeCertificate,
    getVerificationLogs,
    getActivityLogs,
    getPendingVerifiers,
    approveVerifier,
    rejectVerifier,
    getAllVerifiers,
    getPendingApprovals,
    approveUser,
    rejectUser
};

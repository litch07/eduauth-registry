const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { sendRequestApprovedEmail, sendRequestRejectedEmail } = require('../config/email');

/**
 * Get student dashboard with statistics
 * Shows enrollments, certificates, and recent certificates
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getDashboard(req, res) {
    try {
        const userId = req.user.userId;
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Get dashboard summary from view (includes counts for enrollments, certificates, pending requests)
            const [dashboard] = await connection.execute(
                'SELECT * FROM vw_student_dashboard WHERE userId = ?',
                [userId]
            );
            
            if (dashboard.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }
            
            const dashboardData = dashboard[0];
            const studentId = dashboardData.studentId;
            const totalEnrollments = dashboardData.totalEnrollments;
            const totalCertificates = dashboardData.totalCertificates;
            const pendingRequestsCount = dashboardData.pendingRequests;
            const studentName = dashboardData.studentName;
            
            // Get recent 5 certificates with institution names
            const [recentCerts] = await connection.execute(
                `SELECT 
                    c.id,
                    c.serial,
                    c.certificateName,
                    c.certificateLevel,
                    DATE_FORMAT(c.issueDate, '%d/%m/%Y') as issueDate,
                    c.isPubliclyShareable,
                    i.name AS institutionName
                FROM Certificate c
                JOIN Institution i ON c.institutionId = i.id
                WHERE c.studentId = ? AND c.deletedAt IS NULL
                ORDER BY c.issueDate DESC
                LIMIT 5`,
                [studentId]
            );
            
            // Return dashboard data
            return res.status(200).json({
                totalEnrollments,
                totalCertificates,
                pendingRequestsCount,
                recentCertificates: recentCerts,
                studentName
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
 * Get enrollments for the authenticated student
 * Returns institutions and enrollment metadata
 */
async function getEnrollments(req, res) {
    try {
        const userId = req.user.userId;

        const connection = await pool.getConnection();
        try {
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({ error: 'Student profile not found' });
            }

            const studentId = students[0].id;

            const [enrollments] = await connection.execute(
                `SELECT 
                    e.id AS enrollmentId,
                    e.studentInstitutionId,
                    e.department,
                    e.session,
                    e.enrollmentDate,
                    DATE_FORMAT(e.enrollmentDate, '%d/%m/%Y') AS enrollmentDateFormatted,
                    i.name AS institutionName,
                    i.registrationNumber AS institutionRegistration,
                    i.address,
                    i.phone,
                    i.website
                 FROM Enrollment e
                 JOIN Institution i ON e.institutionId = i.id
                 WHERE e.studentId = ?
                 ORDER BY e.enrollmentDate DESC`,
                [studentId]
            );

            return res.status(200).json({ enrollments });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({ error: `Failed to fetch enrollments: ${error.message}` });
    }
}

/**
 * Get all certificates for the student
 * Returns certificates with institution information
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getCertificates(req, res) {
    try {
        const userId = req.user.userId;
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Get student ID for this user
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );
            
            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }
            
            const studentId = students[0].id;
            
            // Get all certificates for this student
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
                    DATE_FORMAT(c.issueDate, '%d/%m/%Y') as issueDate,
                    DATE_FORMAT(c.convocationDate, '%d/%m/%Y') as convocationDate,
                    c.authorityName,
                    c.authorityTitle,
                    c.isPubliclyShareable,
                    i.name AS institutionName,
                    i.registrationNumber AS institutionRegistration,
                    e.studentInstitutionId AS rollNumber
                FROM Certificate c
                JOIN Institution i ON c.institutionId = i.id
                LEFT JOIN Enrollment e ON e.studentId = c.studentId AND e.institutionId = c.institutionId AND e.deletedAt IS NULL
                WHERE c.studentId = ?
                ORDER BY c.issueDate DESC`,
                [studentId]
            );
            
            // Return certificates list
            return res.status(200).json({
                certificates
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
 * Toggle public sharing status of a certificate
 * Allows students to control who can verify their certificates
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware, req.params.id)
 * @param {Object} res - Express response object
 */
async function toggleCertificateSharing(req, res) {
    try {
        const userId = req.user.userId;
        const certificateId = req.params.id;
        
        // Validate certificate ID is provided
        if (!certificateId) {
            return res.status(400).json({
                error: 'Certificate ID is required'
            });
        }
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Get student ID for this user
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );
            
            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }
            
            const studentId = students[0].id;
            
            // Verify certificate ownership
            const [certificate] = await connection.execute(
                'SELECT id, isPubliclyShareable FROM Certificate WHERE id = ? AND studentId = ?',
                [certificateId, studentId]
            );
            
            if (certificate.length === 0) {
                return res.status(403).json({
                    error: 'Unauthorized'
                });
            }
            
            // Toggle isPubliclyShareable status
            await connection.execute(
                'UPDATE Certificate SET isPubliclyShareable = NOT isPubliclyShareable WHERE id = ?',
                [certificateId]
            );
            
            // Get updated value
            const [updatedCert] = await connection.execute(
                'SELECT isPubliclyShareable FROM Certificate WHERE id = ?',
                [certificateId]
            );
            
            const newSharingStatus = updatedCert[0].isPubliclyShareable;
            
            // Return success response
            return res.status(200).json({
                message: 'Sharing status updated',
                isPubliclyShareable: newSharingStatus
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to toggle sharing status: ${error.message}`
        });
    }
}

/**
 * Get student profile information
 * Returns student details including personal and contact information
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getProfile(req, res) {
    try {
        const userId = req.user.userId;
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Get student profile with user email
            const [students] = await connection.execute(
                `SELECT 
                    s.id,
                    s.firstName,
                    s.middleName,
                    s.lastName,
                    s.dateOfBirth,
                    s.nid,
                    s.fatherName,
                    s.motherName,
                    s.phone,
                    s.presentAddress,
                    s.studentId,
                    u.email
                FROM Student s
                JOIN Users u ON s.userId = u.id
                WHERE s.userId = ?`,
                [userId]
            );
            
            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }
            
            // Return profile data
            return res.status(200).json(students[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch profile: ${error.message}`
        });
    }
}

/**
 * Get verification history for student's certificates
 * Shows all certificates with verification counts and recent verifications
 * Optimized: Uses single query with subquery instead of N+1 pattern
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getVerificationHistory(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await pool.getConnection();

        try {
            // Get student ID
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }

            const studentId = students[0].id;

            // Optimized: Get certificates with verification counts and recent verifications in single query
            const [certificates] = await connection.execute(
                `SELECT 
                    c.id,
                    c.serial,
                    c.certificateName,
                    c.certificateLevel,
                    COUNT(v.id) as verificationCount,
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'country', sub.verifierCountry,
                                'verifiedAt', sub.verifiedAt,
                                'timeAgo', CASE
                                    WHEN sub.verifiedAt >= NOW() - INTERVAL 1 HOUR 
                                        THEN CONCAT(TIMESTAMPDIFF(MINUTE, sub.verifiedAt, NOW()), ' minutes ago')
                                    WHEN sub.verifiedAt >= NOW() - INTERVAL 1 DAY 
                                        THEN CONCAT(TIMESTAMPDIFF(HOUR, sub.verifiedAt, NOW()), ' hours ago')
                                    ELSE CONCAT(TIMESTAMPDIFF(DAY, sub.verifiedAt, NOW()), ' days ago')
                                END
                            )
                        )
                        FROM (
                            SELECT verifierCountry, verifiedAt 
                            FROM VerificationLog 
                            WHERE certificateId = c.id 
                            ORDER BY verifiedAt DESC 
                            LIMIT 5
                        ) sub
                    ) as recentVerifications
                FROM Certificate c
                LEFT JOIN VerificationLog v ON c.id = v.certificateId
                WHERE c.studentId = ? AND c.deletedAt IS NULL
                GROUP BY c.id
                ORDER BY verificationCount DESC`,
                [studentId]
            );

            // Transform the results
            const certificatesWithHistory = certificates.map(cert => ({
                certificateId: cert.id,
                serial: cert.serial,
                certificateName: cert.certificateName,
                certificateLevel: cert.certificateLevel,
                verificationCount: cert.verificationCount,
                recentVerifications: cert.recentVerifications ? JSON.parse(cert.recentVerifications) : []
            }));

            return res.status(200).json(certificatesWithHistory);
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch verification history: ${error.message}`
        });
    }
}

/**
 * Get certificate requests from verifiers for the student
 * Separated into categories: pending, approved, rejected, expired
 * 
 * @async
 * @param {Object} req - Express request object (query: status)
 * @param {Object} res - Express response object
 */
async function getMyRequests(req, res) {
    try {
        const userId = req.user.userId;
        const { status } = req.query;

        const connection = await pool.getConnection();

        try {
            // Get student ID
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }

            const studentId = students[0].id;

            // Build query with optional status filter
            let query = `SELECT 
                r.id, r.requestType, r.purpose, r.reason, r.status, r.createdAt, r.expiresAt,
                v.companyName, v.contactPhone, v.isApproved AS verifierVerified,
                c.serial AS certificateSerial,
                DATEDIFF(r.expiresAt, NOW()) AS daysUntilExpiry
            FROM CertificateRequests r
            JOIN Verifiers v ON r.verifierId = v.id
            LEFT JOIN Certificate c ON r.certificateId = c.id
            WHERE r.studentId = ?`;

            const params = [studentId];

            if (status) {
                query += ' AND r.status = ?';
                params.push(status);
            }

            query += ` ORDER BY 
                CASE r.status
                    WHEN 'PENDING' THEN 1
                    WHEN 'APPROVED' THEN 2
                    WHEN 'REJECTED' THEN 3
                    WHEN 'EXPIRED' THEN 4
                END,
                r.createdAt DESC`;

            const [allRequests] = await connection.execute(query, params);

            // Separate into categories
            const categorized = {
                pending: allRequests.filter(r => r.status === 'PENDING'),
                approved: allRequests.filter(r => r.status === 'APPROVED'),
                rejected: allRequests.filter(r => r.status === 'REJECTED'),
                expired: allRequests.filter(r => r.status === 'EXPIRED')
            };

            return res.status(200).json(categorized);
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
 * Approve a verifier's certificate request
 * Creates access grant in VerifierAccess table
 * 
 * @async
 * @param {Object} req - Express request object (params: requestId)
 * @param {Object} res - Express response object
 */
async function approveRequest(req, res) {
    try {
        const userId = req.user.userId;
        const requestId = req.params.requestId || req.params.id;
        if (!requestId) {
            return res.status(400).json({ error: 'Request id is required' });
        }

        const connection = await pool.getConnection();

        try {
            // Get student ID
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }

            const studentId = students[0].id;

            // Get request details
            const [requests] = await connection.execute(
                `SELECT * FROM CertificateRequests 
                WHERE id = ? AND studentId = ? AND status = 'PENDING'`,
                [requestId, studentId]
            );

            if (requests.length === 0) {
                return res.status(404).json({
                    error: 'Request not found or already processed'
                });
            }

            const request = requests[0];

            // Start transaction
            await connection.beginTransaction();

            try {
                // Update request status
                await connection.execute(
                    'UPDATE CertificateRequests SET status = ?, approvedAt = NOW() WHERE id = ?',
                    ['APPROVED', requestId]
                );

                // Calculate access expiry based on request type
                const accessDays = request.requestType === 'ALL_CERTIFICATES' ? 30 : 7;
                const expiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000);

                // Create access grant
                const accessId = uuidv4();
                await connection.execute(
                    `INSERT INTO VerifierAccess 
                    (id, requestId, verifierId, studentId, certificateId, grantedAt, expiresAt) 
                    VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
                    [accessId, requestId, request.verifierId, studentId, request.certificateId || null, expiresAt]
                );

                // Commit transaction
                await connection.commit();

                // Get verifier email
                const [verifiers] = await connection.execute(
                    `SELECT u.email FROM Users u 
                    JOIN Verifiers v ON u.id = v.userId 
                    WHERE v.id = ?`,
                    [request.verifierId]
                );
                const verifierEmail = verifiers[0]?.email || null;

                const [studentRows] = await connection.execute(
                    'SELECT firstName, lastName FROM Student WHERE id = ?',
                    [studentId]
                );
                const studentName = studentRows[0]
                    ? `${studentRows[0].firstName} ${studentRows[0].lastName}`
                    : 'Student';

                // Log activity
                await logActivity(
                    userId,
                    'STUDENT',
                    'APPROVE_REQUEST',
                    'CERTIFICATE_REQUEST',
                    requestId,
                    {
                        requestType: request.requestType,
                        accessDaysGranted: accessDays
                    },
                    req.ip
                );

                if (verifierEmail) {
                    try {
                        await sendRequestApprovedEmail(verifierEmail, {
                            studentName,
                            requestType: request.requestType,
                            expiresAt: new Date(expiresAt).toLocaleDateString()
                        });
                    } catch (emailError) {
                        console.warn('Failed to send approval email:', emailError);
                    }
                }

                return res.status(200).json({
                    message: 'Request approved. Verifier has been notified.',
                    accessExpiresAt: expiresAt
                });
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to approve request: ${error.message}`
        });
    }
}

/**
 * Reject a verifier's certificate request
 * 
 * @async
 * @param {Object} req - Express request object (params: requestId, body: rejectionReason)
 * @param {Object} res - Express response object
 */
async function rejectRequest(req, res) {
    try {
        const userId = req.user.userId;
        const requestId = req.params.requestId || req.params.id;
        if (!requestId) {
            return res.status(400).json({ error: 'Request id is required' });
        }
        const { rejectionReason } = req.body;

        const connection = await pool.getConnection();

        try {
            // Get student ID
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }

            const studentId = students[0].id;

            // Get request details
            const [requests] = await connection.execute(
                `SELECT * FROM CertificateRequests 
                WHERE id = ? AND studentId = ? AND status = 'PENDING'`,
                [requestId, studentId]
            );

            if (requests.length === 0) {
                return res.status(404).json({
                    error: 'Request not found or already processed'
                });
            }

            const request = requests[0];
            const reason = rejectionReason || 'No reason provided';

            // Update request status
            await connection.execute(
                'UPDATE CertificateRequests SET status = ?, rejectedAt = NOW(), rejectionReason = ? WHERE id = ?',
                ['REJECTED', reason, requestId]
            );

            const [studentRows] = await connection.execute(
                'SELECT firstName, lastName FROM Student WHERE id = ?',
                [studentId]
            );
            const studentName = studentRows[0]
                ? `${studentRows[0].firstName} ${studentRows[0].lastName}`
                : 'Student';

            const [verifiers] = await connection.execute(
                `SELECT u.email FROM Users u 
                 JOIN Verifiers v ON u.id = v.userId 
                 WHERE v.id = ?`,
                [request.verifierId]
            );
            const verifierEmail = verifiers[0]?.email || null;

            // Log activity
            await logActivity(
                userId,
                'STUDENT',
                'REJECT_REQUEST',
                'CERTIFICATE_REQUEST',
                requestId,
                {
                    rejectionReason: reason
                },
                req.ip
            );

            if (verifierEmail) {
                try {
                    await sendRequestRejectedEmail(verifierEmail, {
                        studentName,
                        rejectionReason: reason
                    });
                } catch (emailError) {
                    console.warn('Failed to send rejection email:', emailError);
                }
            }

            return res.status(200).json({
                message: 'Request rejected'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to reject request: ${error.message}`
        });
    }
}

/**
 * Get active access grants to student's certificates
 * Shows what verifiers currently have access
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getGrantedAccess(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await pool.getConnection();

        try {
            // Get student ID
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }

            const studentId = students[0].id;

            // Get active access grants
            const [grantedAccess] = await connection.execute(
                `SELECT 
                    a.id, a.grantedAt, a.expiresAt, a.certificateId,
                    v.companyName, v.purpose,
                    c.serial AS certificateSerial,
                    r.purpose AS requestPurpose
                FROM VerifierAccess a
                JOIN Verifiers v ON a.verifierId = v.id
                JOIN CertificateRequests r ON a.requestId = r.id
                LEFT JOIN Certificate c ON a.certificateId = c.id
                WHERE a.studentId = ? AND a.expiresAt > NOW() AND a.revokedAt IS NULL
                ORDER BY a.expiresAt ASC`,
                [studentId]
            );

            return res.status(200).json({
                grantedAccess
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch granted access: ${error.message}`
        });
    }
}

/**
 * Revoke access grant to student's certificates
 * 
 * @async
 * @param {Object} req - Express request object (params: accessId, body: revokeReason)
 * @param {Object} res - Express response object
 */
async function revokeAccess(req, res) {
    try {
        const userId = req.user.userId;
        const accessId = req.params.accessId || req.params.id;
        if (!accessId) {
            return res.status(400).json({ error: 'Access id is required' });
        }
        const { revokeReason } = req.body;

        const connection = await pool.getConnection();

        try {
            // Get student ID
            const [students] = await connection.execute(
                'SELECT id FROM Student WHERE userId = ?',
                [userId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student profile not found'
                });
            }

            const studentId = students[0].id;

            // Get access grant details
            const [accessGrants] = await connection.execute(
                `SELECT * FROM VerifierAccess 
                WHERE id = ? AND studentId = ? AND revokedAt IS NULL`,
                [accessId, studentId]
            );

            if (accessGrants.length === 0) {
                return res.status(404).json({
                    error: 'Access grant not found or already revoked'
                });
            }

            const reason = revokeReason || 'Revoked by student';

            // Update access grant
            await connection.execute(
                'UPDATE VerifierAccess SET revokedAt = NOW(), revokedReason = ? WHERE id = ?',
                [reason, accessId]
            );

            // Log activity
            await logActivity(
                userId,
                'STUDENT',
                'REVOKE_ACCESS',
                'VERIFIER_ACCESS',
                accessId,
                {
                    revokeReason: reason
                },
                req.ip
            );

            return res.status(200).json({
                message: 'Access revoked successfully'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to revoke access: ${error.message}`
        });
    }
}

module.exports = {
    getDashboard,
    getEnrollments,
    getCertificates,
    toggleCertificateSharing,
    getProfile,
    getVerificationHistory,
    getMyRequests,
    approveRequest,
    rejectRequest,
    getGrantedAccess,
    revokeAccess
};

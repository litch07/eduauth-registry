const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { generateCertificateSerial } = require('../utils/serialGenerator');
const { logActivity } = require('../utils/activityLogger');
const { sendCertificateIssuedEmail } = require('../config/email');

/**
 * Get university dashboard with statistics
 * Shows enrolled students, certificates issued, and recent certificates
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
            // Get dashboard summary from view (includes counts for students, certificates, and today's certificates)
            const [dashboard] = await connection.execute(
                'SELECT * FROM vw_university_dashboard WHERE userId = ?',
                [userId]
            );
            
            if (dashboard.length === 0) {
                return res.status(404).json({
                    error: 'Institution not found'
                });
            }
            
            const dashboardData = dashboard[0];
            const institutionId = dashboardData.institutionId;
            const institutionName = dashboardData.universityName;
            const totalStudents = dashboardData.totalStudents;
            const totalCertificates = dashboardData.totalCertificates;
            const todayCertificates = dashboardData.todayCertificates;
            
            // Get recent 5 certificates with student names
            const [recentCerts] = await connection.execute(
                `SELECT 
                    c.serial,
                    c.certificateName,
                    DATE_FORMAT(c.issueDate, '%d/%m/%Y') as issueDate,
                    CONCAT(s.firstName, ' ', s.lastName) as studentName
                FROM Certificate c
                JOIN Student s ON c.studentId = s.id
                WHERE c.institutionId = ? AND c.deletedAt IS NULL
                ORDER BY c.issueDate DESC
                LIMIT 5`,
                [institutionId]
            );
            
            // Return dashboard data
            return res.status(200).json({
                totalStudents,
                totalCertificates,
                todayCertificates,
                recentCertificates: recentCerts,
                institutionName
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
 * Get list of students enrolled in the university
 * Returns all enrolled students with contact information
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getEnrolledStudents(req, res) {
    try {
        const userId = req.user.userId;
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Get institution ID for this user
            const [institutions] = await connection.execute(
                'SELECT id FROM Institution WHERE userId = ?',
                [userId]
            );
            
            if (institutions.length === 0) {
                return res.status(404).json({
                    error: 'Institution not found'
                });
            }
            
            const institutionId = institutions[0].id;
            
            // Get all enrolled students from view
            const [students] = await connection.execute(
                `SELECT 
                    enrollmentId,
                    studentInstitutionId,
                    DATE_FORMAT(enrollmentDate, '%d/%m/%Y') as enrollmentDate,
                    department,
                    session,
                    studentId,
                    studentName,
                    studentSystemId,
                    studentEmail,
                    certificatesIssued
                FROM vw_active_enrollments
                WHERE institutionId = ?
                ORDER BY enrollmentDate DESC`,
                [institutionId]
            );
            
            // Return students list
            return res.status(200).json({
                students
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to fetch enrolled students: ${error.message}`
        });
    }
}

/**
 * Get list of certificates issued by the institution
 *
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function getCertificates(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await pool.getConnection();

        try {
            const [institutions] = await connection.execute(
                'SELECT id FROM Institution WHERE userId = ?',
                [userId]
            );

            if (institutions.length === 0) {
                return res.status(404).json({ error: 'Institution not found' });
            }

            const institutionId = institutions[0].id;

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
                    CONCAT(s.firstName, ' ', s.lastName) AS studentName,
                    s.studentId AS studentSystemId,
                    e.studentInstitutionId AS rollNumber
                FROM Certificate c
                JOIN Student s ON c.studentId = s.id
                LEFT JOIN Enrollment e
                    ON e.studentId = s.id
                   AND e.institutionId = c.institutionId
                   AND e.deletedAt IS NULL
                WHERE c.institutionId = ? AND c.deletedAt IS NULL
                ORDER BY c.issueDate DESC, c.createdAt DESC`,
                [institutionId]
            );

            return res.status(200).json({ certificates });
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
 * Search enrolled students for the institution
 * Supports query by roll, name, or email with pagination
 *
 * @async
 * @param {Object} req
 * @param {Object} res
 */
async function searchEnrolledStudents(req, res) {
    try {
        const userId = req.user.userId;
        const q = (req.query.q || '').toString().trim();
        const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const offset = (page - 1) * limit;
        const sortParam = (req.query.sort || 'asc').toString().toLowerCase();
        const sort = sortParam === 'desc' ? 'DESC' : 'ASC';

        if (q.length < 2) {
            return res.status(400).json({ error: 'Search term must be at least 2 characters.' });
        }

        const connection = await pool.getConnection();
        try {
            const [institutions] = await connection.execute(
                'SELECT id FROM Institution WHERE userId = ?',
                [userId]
            );
            if (institutions.length === 0) {
                return res.status(404).json({ error: 'Institution not found' });
            }
            const institutionId = institutions[0].id;

            const like = `%${q}%`;
                        // Total count for pagination
                        const [countRows] = await connection.execute(
                                `SELECT COUNT(*) AS total
                                 FROM Enrollment e
                                 JOIN Student s ON e.studentId = s.id
                                 JOIN Users u ON s.userId = u.id
                                 WHERE e.institutionId = ?
                                     AND (
                                                e.studentInstitutionId LIKE ?
                                         OR s.firstName LIKE ?
                                         OR s.lastName LIKE ?
                                         OR u.email LIKE ?
                                     )`,
                                [institutionId, like, like, like, like]
                        );

                        const total = countRows[0]?.total || 0;

                        const [rows] = await connection.execute(
                                `SELECT 
                                        e.id AS enrollmentId,
                                        e.studentInstitutionId,
                                        s.id AS studentId,
                                        s.firstName,
                                        s.lastName,
                                        u.email
                                 FROM Enrollment e
                                 JOIN Student s ON e.studentId = s.id
                                 JOIN Users u ON s.userId = u.id
                                 WHERE e.institutionId = ?
                                     AND (
                                                e.studentInstitutionId LIKE ?
                                         OR s.firstName LIKE ?
                                         OR s.lastName LIKE ?
                                         OR u.email LIKE ?
                                     )
                                 ORDER BY e.studentInstitutionId ${sort}
                                 LIMIT ? OFFSET ?`,
                                [institutionId, like, like, like, like, limit, offset]
                        );

                        return res.status(200).json({
                                results: rows,
                                pagination: { page, limit, total, sort: sort.toLowerCase() }
                        });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to search students: ${error.message}`
        });
    }
}
/**
 * Issue a new digital certificate to a student
 * Generates unique serial number and stores certificate record
 * 
 * @async
 * @param {Object} req - Express request object (req.user from JWT middleware)
 * @param {Object} res - Express response object
 */
async function issueCertificate(req, res) {
    try {
        const userId = req.user.userId;
        
        // Extract certificate data from request body
        const {
            studentId,
            certificateLevel,
            certificateName,
            department,
            major,
            session,
            rollNumber,
            cgpa,
            issueDate,
            convocationDate
        } = req.body;
        
        // Validate required fields
        if (!studentId || !certificateLevel || !certificateName || !department || !issueDate) {
            return res.status(400).json({
                error: 'Missing required fields: studentId, certificateLevel, certificateName, department, issueDate'
            });
        }
        
        // Validate certificate level
        const validLevels = ['BACHELOR', 'MASTER', 'DOCTORATE'];
        if (!validLevels.includes(certificateLevel)) {
            return res.status(400).json({
                error: `Invalid certificate level. Must be one of: ${validLevels.join(', ')}`
            });
        }
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Get institution ID and authority info in single query
            const [institutions] = await connection.execute(
                'SELECT id, name, authorityName, authorityTitle FROM Institution WHERE userId = ?',
                [userId]
            );
            
            if (institutions.length === 0) {
                return res.status(404).json({
                    error: 'Institution not found'
                });
            }
            
            const { id: institutionId, name: institutionName, authorityName, authorityTitle } = institutions[0];
            
            // Verify student is enrolled in this institution
            const [enrollment] = await connection.execute(
                'SELECT id, IDNumber FROM Enrollment WHERE studentId = ? AND institutionId = ?',
                [studentId, institutionId]
            );
            
            if (enrollment.length === 0) {
                return res.status(403).json({
                    error: 'Student must be enrolled before issuing certificate'
                });
            }
            
            // ID number: prefer request payload, otherwise use enrollment
            const enrollmentIDNumber = enrollment[0]?.IDNumber || null;
            const effectiveIDNumber = rollNumber && rollNumber !== '' ? rollNumber : enrollmentIDNumber;

            // Generate serial with certificate level (produces format: BSC-25-000001M, etc.)
            const { serial, sequenceNumber } = await generateCertificateSerial(certificateLevel);
            const certificateId = uuidv4();
               await connection.execute(
                   `INSERT INTO Certificate (
                       id, serial, sequenceNumber, certificateLevel, certificateName,
                       studentId, institutionId, department, major, session,
                       IDNumber, cgpa,
                       issueDate, convocationDate, authorityName, authorityTitle,
                       isPubliclyShareable
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                   [
                       certificateId,
                       serial,
                       sequenceNumber,
                       certificateLevel,
                       certificateName,
                       studentId,
                       institutionId,
                       department,
                       major || null,
                       session || null,
                       effectiveIDNumber,
                       cgpa !== undefined && cgpa !== null && cgpa !== '' ? parseFloat(cgpa) : null,
                       issueDate,
                       convocationDate || null,
                       authorityName,
                       authorityTitle,
                       true
                   ]
               );
            
            // Log activity
            await logActivity(
                req.user.userId,
                'UNIVERSITY',
                'CERTIFICATE_ISSUED',
                'CERTIFICATE',
                certificateId,
                {
                    serial,
                    studentId,
                    certificateName,
                    certificateLevel
                },
                req.ip
            );

            try {
                const [studentRows] = await connection.execute(
                    'SELECT u.email FROM Student s JOIN Users u ON s.userId = u.id WHERE s.id = ?',
                    [studentId]
                );
                const studentEmail = studentRows[0]?.email;
                if (studentEmail) {
                    await sendCertificateIssuedEmail(studentEmail, {
                        serial,
                        certificateName,
                        certificateLevel,
                        institutionName,
                        issueDate
                    });
                }
            } catch (emailError) {
                console.warn('Failed to send certificate issued email:', emailError);
            }
            
            return res.status(201).json({
                message: 'Certificate issued successfully',
                serial,
                certificateId
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to issue certificate: ${error.message}`
        });
    }
}

async function getProfile(req, res) {
    try {
        const userId = req.user.userId;
        const connection = await pool.getConnection();
        
        try {
            const [institutions] = await connection.execute(
                `SELECT 
                    i.id,
                    i.name,
                    i.registrationNumber,
                    i.establishedYear,
                    i.phone,
                    i.address,
                    i.website,
                    i.authorityName,
                    i.authorityTitle,
                    u.email
                FROM Institution i
                JOIN Users u ON i.userId = u.id
                WHERE i.userId = ?`,
                [userId]
            );
            
            if (institutions.length === 0) {
                return res.status(404).json({
                    error: 'Institution profile not found'
                });
            }
            
            return res.status(200).json(institutions[0]);
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
 * Enroll a student in the institution
 * Creates a new enrollment record for a student
 * 
 * @async
 * @param {Object} req - Express request object with user and body data
 * @param {Object} res - Express response object
 */
async function enrollStudent(req, res) {
    try {
        const userId = req.user.userId;
        const { studentId, studentInstitutionId, enrollmentDate, department, session } = req.body;

        // Validate required fields
        if (!studentId || !studentInstitutionId || !enrollmentDate || !department || !session) {
            return res.status(400).json({
                error: 'Missing required fields: studentId, studentInstitutionId, enrollmentDate, department, session'
            });
        }

        const connection = await pool.getConnection();

        try {
            // Get institution ID for this user
            const [institutions] = await connection.execute(
                'SELECT id FROM Institution WHERE userId = ?',
                [userId]
            );

            if (institutions.length === 0) {
                return res.status(404).json({
                    error: 'Institution not found'
                });
            }

            const institutionId = institutions[0].id;

            // Check if student exists and is approved
            const [students] = await connection.execute(
                'SELECT id, firstName, lastName FROM Student WHERE id = ? AND isApproved = TRUE AND deletedAt IS NULL',
                [studentId]
            );

            if (students.length === 0) {
                return res.status(404).json({
                    error: 'Student not found or not approved'
                });
            }

            const student = students[0];

            // Check if student is already enrolled in this institution
            const [existingEnrollments] = await connection.execute(
                'SELECT id FROM Enrollment WHERE studentId = ? AND institutionId = ?',
                [studentId, institutionId]
            );

            if (existingEnrollments.length > 0) {
                return res.status(400).json({
                    error: 'Student already enrolled in this institution'
                });
            }

            // Create new enrollment
            const enrollmentId = uuidv4();
            await connection.execute(
                `INSERT INTO Enrollment 
                 (id, studentId, institutionId, studentInstitutionId, enrollmentDate, department, session) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [enrollmentId, studentId, institutionId, studentInstitutionId, enrollmentDate, department, session]
            );

            // Log activity
            await logActivity(
                userId,
                'UNIVERSITY',
                'ENROLL_STUDENT',
                'ENROLLMENT',
                enrollmentId,
                {
                    studentId,
                    studentName: `${student.firstName} ${student.lastName}`,
                    studentInstitutionId,
                    department,
                    session
                },
                req.ip
            );

            return res.status(201).json({
                message: 'Student enrolled successfully',
                enrollmentId
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to enroll student: ${error.message}`
        });
    }
}

/**
 * Search for students to enroll
 * Searches students by email, NID, first name, or last name
 * Returns list with enrollment status for current institution
 * 
 * @async
 * @param {Object} req - Express request object with query.q parameter
 * @param {Object} res - Express response object
 */
async function searchStudent(req, res) {
    try {
        const userId = req.user.userId;
        const searchQuery = req.query.q?.trim();

        if (!searchQuery || searchQuery.length < 2) {
            return res.status(400).json({
                error: 'Search query must be at least 2 characters'
            });
        }

        const connection = await pool.getConnection();

        try {
            // Get institution ID for this user
            const [institutions] = await connection.execute(
                'SELECT id FROM Institution WHERE userId = ?',
                [userId]
            );

            if (institutions.length === 0) {
                return res.status(404).json({
                    error: 'Institution not found'
                });
            }

            const institutionId = institutions[0].id;

            // Search for students
            const searchTerm = `%${searchQuery}%`;
            const [students] = await connection.execute(
                `SELECT 
                    s.id,
                    s.firstName,
                    s.lastName,
                    s.dateOfBirth,
                    s.studentId,
                    s.nid,
                    u.email
                FROM Student s
                JOIN Users u ON s.userId = u.id
                WHERE u.email LIKE ? 
                   OR s.nid LIKE ?
                   OR s.firstName LIKE ?
                   OR s.lastName LIKE ?
                LIMIT 20`,
                [searchTerm, searchTerm, searchTerm, searchTerm]
            );

            // Check enrollment status for each student
            const studentsWithEnrollmentStatus = await Promise.all(
                students.map(async (student) => {
                    const [enrollments] = await connection.execute(
                        'SELECT id FROM Enrollment WHERE studentId = ? AND institutionId = ?',
                        [student.id, institutionId]
                    );

                    return {
                        id: student.id,
                        firstName: student.firstName,
                        lastName: student.lastName,
                        dateOfBirth: student.dateOfBirth,
                        studentId: student.studentId,
                        nid: student.nid,
                        email: student.email,
                        isEnrolled: enrollments.length > 0
                    };
                })
            );

            return res.status(200).json({
                students: studentsWithEnrollmentStatus
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Failed to search students: ${error.message}`
        });
    }
}

module.exports = {
    getDashboard,
    getEnrolledStudents,
    getCertificates,
    searchEnrolledStudents,
    issueCertificate,
    getProfile,
    searchStudent,
    enrollStudent
};

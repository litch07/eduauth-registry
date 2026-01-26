const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { generateVerificationCode, sendVerificationEmail, sendAdminNotification } = require('../config/email');

/**
 * Register a new student account
 * Creates entries in Users and Student tables within a transaction
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerStudent(req, res) {
    let connection;
    try {
        // Extract and validate required fields from request body
        const {
            firstName,
            lastName,
            dateOfBirth,
            nid,
            fatherName,
            motherName,
            phone,
            presentAddress,
            email,
            password,
            middleName
        } = req.body;
        
        // Validate all required fields
        if (!firstName || !lastName || !dateOfBirth || !fatherName || !motherName || !phone || !presentAddress || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields: firstName, lastName, dateOfBirth, fatherName, motherName, phone, presentAddress, email, password'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }
        
        // Validate password strength (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }
        
        // Get connection from pool
        connection = await pool.getConnection();
        
        // Check if email already exists
        const [existingUser] = await connection.execute(
            'SELECT id FROM Users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }
        
        // Hash password with bcrypt (12 rounds for security)
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Generate unique studentId: "STD-YYYY-XXXXX" format
        const currentYear = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const studentId = `STD-${currentYear}-${randomNum}`;
        
        // Start transaction for atomic operation
        await connection.beginTransaction();
        
        try {
            // Generate UUIDs for new records
            const userId = uuidv4();
            const studentRecordId = uuidv4();
            
            // Insert into Users table
            await connection.execute(
                'INSERT INTO Users (id, email, password, role, emailVerified) VALUES (?, ?, ?, ?, ?)',
                [userId, email, hashedPassword, 'STUDENT', false]
            );
            
            // Insert into Student table
            await connection.execute(
                'INSERT INTO Student (id, userId, firstName, middleName, lastName, dateOfBirth, nid, fatherName, motherName, phone, presentAddress, studentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [studentRecordId, userId, firstName, middleName || null, lastName, dateOfBirth, nid || null, fatherName, motherName, phone, presentAddress, studentId]
            );
            
            // Commit transaction
            await connection.commit();
            
            // Return success response
            return res.status(201).json({
                message: 'Registration successful. Please check your email for verification code.',
                userId
            });
        } catch (txError) {
            // Rollback transaction on error
            await connection.rollback();
            throw txError;
        }
    } catch (error) {
        return res.status(500).json({
            error: `Registration failed: ${error.message}`
        });
    } finally {
        // Release connection back to pool
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Register a new university account
 * Creates entries in Users and Institution tables within a transaction
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerUniversity(req, res) {
    let connection;
    try {
        // Extract and validate required fields from request body
        const {
            name,
            registrationNumber,
            establishedYear,
            phone,
            address,
            website,
            authorityName,
            authorityTitle,
            email,
            password
        } = req.body;
        
        // Validate all required fields
        if (!name || !registrationNumber || !phone || !address || !authorityName || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields: name, registrationNumber, phone, address, authorityName, email, password'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }
        
        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }
        
        // Get connection from pool
        connection = await pool.getConnection();
        
        // Check if email already exists
        const [existingUser] = await connection.execute(
            'SELECT id FROM Users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }
        
        // Check if registration number already exists
        const [existingInstitution] = await connection.execute(
            'SELECT id FROM Institution WHERE registrationNumber = ?',
            [registrationNumber]
        );
        
        if (existingInstitution.length > 0) {
            return res.status(409).json({
                error: 'Registration number already exists'
            });
        }
        
        // Hash password with bcrypt (12 rounds for security)
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Start transaction for atomic operation
        await connection.beginTransaction();
        
        try {
            // Generate UUIDs for new records
            const userId = uuidv4();
            const institutionId = uuidv4();
            
            // Insert into Users table
            await connection.execute(
                'INSERT INTO Users (id, email, password, role, emailVerified) VALUES (?, ?, ?, ?, ?)',
                [userId, email, hashedPassword, 'UNIVERSITY', false]
            );
            
            // Insert into Institution table
            await connection.execute(
                'INSERT INTO Institution (id, userId, name, registrationNumber, establishedYear, phone, address, website, authorityName, authorityTitle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [institutionId, userId, name, registrationNumber, establishedYear || null, phone, address, website || null, authorityName, authorityTitle || 'Vice Chancellor']
            );
            
            // Commit transaction
            await connection.commit();
            
            // Return success response
            return res.status(201).json({
                message: 'Registration successful. Please check your email for verification code.',
                userId
            });
        } catch (txError) {
            // Rollback transaction on error
            await connection.rollback();
            throw txError;
        }
    } catch (error) {
        return res.status(500).json({
            error: `Registration failed: ${error.message}`
        });
    } finally {
        // Release connection back to pool
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Register a new verifier account
 * Creates entries in Users and Verifiers tables within a transaction
 * Requires admin approval before verification access
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerVerifier(req, res) {
    let connection;
    try {
        // Extract and validate required fields from request body
        const {
            companyName,
            companyRegistration,
            website,
            purpose,
            contactPhone,
            email,
            password
        } = req.body;
        
        // Validate all required fields
        if (!companyName || !purpose || !contactPhone || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields: companyName, purpose, contactPhone, email, password'
            });
        }
        
        // Validate purpose enum
        const validPurposes = ['Employment', 'Education', 'Background Check', 'Other'];
        if (!validPurposes.includes(purpose)) {
            return res.status(400).json({
                error: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }
        
        // Validate password strength (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }
        
        // Get connection from pool
        connection = await pool.getConnection();
        
        // Check if email already exists
        const [existingUser] = await connection.execute(
            'SELECT id FROM Users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }
        
        // Hash password with bcrypt (12 rounds for security)
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Start transaction for atomic operation
        await connection.beginTransaction();
        
        try {
            // Generate UUIDs for new records
            const userId = uuidv4();
            const verifierId = uuidv4();
            
            // Insert into Users table (emailVerified = FALSE, requires email verification)
            await connection.execute(
                'INSERT INTO Users (id, email, password, role, emailVerified) VALUES (?, ?, ?, ?, ?)',
                [userId, email, hashedPassword, 'VERIFIER', false]
            );
            
            // Insert into Verifiers table (isApproved = FALSE, requires admin approval)
            await connection.execute(
                'INSERT INTO Verifiers (id, userId, companyName, companyRegistration, website, purpose, contactPhone, isApproved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [verifierId, userId, companyName, companyRegistration || null, website || null, purpose, contactPhone, false]
            );
            
            // Commit transaction
            await connection.commit();
            
            // Return success response
            return res.status(201).json({
                message: 'Registration successful. Please check your email for verification code.',
                userId
            });
        } catch (txError) {
            // Rollback transaction on error
            await connection.rollback();
            throw txError;
        }
    } catch (error) {
        return res.status(500).json({
            error: `Registration failed: ${error.message}`
        });
    } finally {
        // Release connection back to pool
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Login with email and password
 * Generates JWT token for authenticated user
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function login(req, res) {
    try {
        // Extract email and password from request body
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Find user by email
            const [users] = await connection.execute(
                'SELECT id, email, password, role, emailVerified FROM Users WHERE email = ?',
                [email]
            );
            
            // Check if user exists
            if (users.length === 0) {
                return res.status(401).json({
                    error: 'Invalid credentials'
                });
            }
            
            const user = users[0];

            if (!user.emailVerified) {
                return res.status(403).json({
                    error: 'Email not verified',
                    requiresEmailVerification: true,
                    email: user.email
                });
            }

            // Prevent admins from logging in through regular login endpoint
            if (user.role === 'ADMIN') {
                return res.status(401).json({
                    error: 'Admins must use admin login endpoint'
                });
            }

            // Check admin approval status
            let isApproved = false;
            if (user.role === 'STUDENT') {
                const [students] = await connection.execute(
                    'SELECT isApproved FROM Student WHERE userId = ?',
                    [user.id]
                );
                isApproved = !!students[0]?.isApproved;
            } else if (user.role === 'UNIVERSITY') {
                const [institutions] = await connection.execute(
                    'SELECT isApproved FROM Institution WHERE userId = ?',
                    [user.id]
                );
                isApproved = !!institutions[0]?.isApproved;
            } else if (user.role === 'VERIFIER') {
                const [verifiers] = await connection.execute(
                    'SELECT isApproved FROM Verifiers WHERE userId = ?',
                    [user.id]
                );
                isApproved = !!verifiers[0]?.isApproved;
            }

            if (!isApproved) {
                return res.status(403).json({
                    error: 'Account pending admin approval',
                    pendingApproval: true
                });
            }
            
            // Compare provided password with stored hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({
                    error: 'Invalid credentials'
                });
            }
            
            let displayName = null;
            if (user.role === 'STUDENT') {
                const [students] = await connection.execute(
                    'SELECT firstName, middleName, lastName FROM Student WHERE userId = ?',
                    [user.id]
                );
                if (students.length > 0) {
                    const { firstName, middleName, lastName } = students[0];
                    displayName = `${firstName} ${middleName ? `${middleName} ` : ''}${lastName}`.trim();
                }
            } else if (user.role === 'UNIVERSITY') {
                const [institutions] = await connection.execute(
                    'SELECT name FROM Institution WHERE userId = ?',
                    [user.id]
                );
                displayName = institutions[0]?.name || null;
            } else if (user.role === 'VERIFIER') {
                const [verifiers] = await connection.execute(
                    'SELECT companyName FROM Verifiers WHERE userId = ?',
                    [user.id]
                );
                displayName = verifiers[0]?.companyName || null;
            }

            // Generate JWT token with 7 day expiration
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Return token and user information
            return res.status(200).json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: displayName || user.email
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Login failed: ${error.message}`
        });
    }
}

/**
 * Admin login with email and password
 * Generates JWT token for authenticated admin user
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function adminLogin(req, res) {
    try {
        // Extract email and password from request body
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Find admin by email in Admins table
            const [admins] = await connection.execute(
                'SELECT id, email, password, name FROM Admins WHERE email = ?',
                [email]
            );
            
            // Check if admin exists
            if (admins.length === 0) {
                return res.status(401).json({
                    error: 'Invalid credentials'
                });
            }
            
            const admin = admins[0];
            
            // Compare provided password with stored hashed password
            const passwordMatch = await bcrypt.compare(password, admin.password);
            
            if (!passwordMatch) {
                return res.status(401).json({
                    error: 'Invalid credentials'
                });
            }
            
            // Generate JWT token with 7 day expiration and ADMIN role
            const token = jwt.sign(
                {
                    userId: admin.id,
                    email: admin.email,
                    role: 'ADMIN'
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Return token and admin information
            return res.status(200).json({
                token,
                user: {
                    id: admin.id,
                    email: admin.email,
                    role: 'ADMIN',
                    name: admin.name || admin.email
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        return res.status(500).json({
            error: `Admin login failed: ${error.message}`
        });
    }
}

async function sendVerificationCode(req, res) {
    let connection;
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        connection = await pool.getConnection();

        const [users] = await connection.execute(
            'SELECT id, emailVerified FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (users[0].emailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        const userId = users[0].id;
        const code = generateVerificationCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await connection.execute(
            'INSERT INTO EmailVerificationCodes (id, userId, code, expiresAt) VALUES (?, ?, ?, ?)',
            [uuidv4(), userId, code, expiresAt]
        );

        await sendVerificationEmail(email, code);

        return res.status(200).json({
            message: 'Verification code sent to your email',
            expiresIn: 600
        });
    } catch (error) {
        console.error('Send verification code error:', error);
        return res.status(500).json({ error: 'Failed to send verification code' });
    } finally {
        if (connection) connection.release();
    }
}

async function verifyEmailCode(req, res) {
    let connection;
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        connection = await pool.getConnection();

        const [users] = await connection.execute(
            'SELECT id, role, emailVerified FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (users[0].emailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        const userId = users[0].id;
        const userRole = users[0].role;

        const [codes] = await connection.execute(
            'SELECT id, expiresAt, isUsed FROM EmailVerificationCodes WHERE userId = ? AND code = ? ORDER BY createdAt DESC LIMIT 1',
            [userId, code]
        );

        if (codes.length === 0) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        const codeData = codes[0];
        if (codeData.isUsed) {
            return res.status(400).json({ error: 'Verification code already used' });
        }
        if (new Date() > new Date(codeData.expiresAt)) {
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        await connection.execute(
            'UPDATE EmailVerificationCodes SET isUsed = TRUE WHERE id = ?',
            [codeData.id]
        );

        await connection.execute(
            'UPDATE Users SET emailVerified = TRUE WHERE id = ?',
            [userId]
        );

        let userData = { email };
        if (userRole === 'STUDENT') {
            const [students] = await connection.execute(
                'SELECT firstName, lastName, nid, DATE_FORMAT(dateOfBirth, "%d/%m/%Y") as dateOfBirth FROM Student WHERE userId = ?',
                [userId]
            );
            userData = { ...userData, ...students[0] };
        } else if (userRole === 'UNIVERSITY') {
            const [institutions] = await connection.execute(
                'SELECT name, registrationNumber, address FROM Institution WHERE userId = ?',
                [userId]
            );
            userData = { ...userData, ...institutions[0], city: institutions[0]?.address };
        } else if (userRole === 'VERIFIER') {
            const [verifiers] = await connection.execute(
                'SELECT companyName, purpose, contactPhone FROM Verifiers WHERE userId = ?',
                [userId]
            );
            userData = { ...userData, ...verifiers[0] };
        }

        await sendAdminNotification(
            userRole === 'STUDENT' ? 'Student' : userRole === 'UNIVERSITY' ? 'University' : 'Verifier',
            userData
        );

        return res.status(200).json({
            message: 'Email verified successfully! Your account is pending admin approval. You will be notified via email once approved.',
            emailVerified: true,
            pendingApproval: true
        });
    } catch (error) {
        console.error('Verify email error:', error);
        return res.status(500).json({ error: 'Failed to verify email' });
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    registerStudent,
    registerUniversity,
    registerVerifier,
    login,
    adminLogin,
    sendVerificationCode,
    verifyEmailCode
};

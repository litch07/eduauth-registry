require('dotenv').config();

const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eduauth_registry',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

// Test database connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        logger.success('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        logger.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
})();

module.exports = pool;

const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

/**
 * Log a system activity to the ActivityLog table
 * Non-blocking: logging failures don't affect main operations
 * 
 * @async
 * @param {string} actorId - User ID performing the action (can be null for system actions)
 * @param {string} actorType - Type of actor: STUDENT, UNIVERSITY, ADMIN, or SYSTEM
 * @param {string} action - Action name (e.g., "certificate_issued", "user_registered")
 * @param {string} targetType - Type of target entity (e.g., CERTIFICATE, STUDENT, UNIVERSITY)
 * @param {string} targetId - ID of the target entity (can be null)
 * @param {Object} details - Additional context as an object (will be JSON stringified)
 * @param {string} ipAddress - IP address of the actor (can be null for system actions)
 * 
 * @example
 * await logActivity(
 *   userId,
 *   'UNIVERSITY',
 *   'certificate_issued',
 *   'CERTIFICATE',
 *   certificateId,
 *   { serial: 'BSC-25-000001M', studentName: 'John Doe' },
 *   '192.168.1.1'
 * );
 */
async function logActivity(actorId, actorType, action, targetType, targetId, details, ipAddress) {
    try {
        const logId = uuidv4();
        
        // Ensure actorType is valid
        const validActorTypes = ['STUDENT', 'UNIVERSITY', 'VERIFIER', 'ADMIN', 'SYSTEM'];
        if (!validActorTypes.includes(actorType)) {
            console.warn(`Invalid actorType: ${actorType}`);
            return;
        }
        
        // Ensure action is provided
        if (!action) {
            console.warn('Action is required for activity logging');
            return;
        }
        
        // Get connection from pool
        const connection = await pool.getConnection();
        
        try {
            // Insert activity log record
            await connection.execute(
                `INSERT INTO ActivityLog 
                 (id, actorId, actorType, action, targetType, targetId, details, ipAddress, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    logId,
                    actorId || null,
                    actorType,
                    action,
                    targetType || null,
                    targetId || null,
                    details ? JSON.stringify(details) : null,
                    ipAddress || null
                ]
            );
        } finally {
            connection.release();
        }
    } catch (error) {
        // Log errors but don't fail the main operation
        console.error('Activity logging failed:', error);
    }
}

module.exports = { logActivity };

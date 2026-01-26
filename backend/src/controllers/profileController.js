const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { generateVerificationCode, sendVerificationEmail, transporter } = require('../config/email');

async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'ADMIN') {
      const [admins] = await db.query(
        'SELECT id, email, name, createdAt FROM Admins WHERE id = ?',
        [userId]
      );

      if (!admins.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        profile: {
          id: admins[0].id,
          email: admins[0].email,
          role: 'ADMIN',
          name: admins[0].name,
          emailVerified: true,
          createdAt: admins[0].createdAt
        }
      });
    }

    const [users] = await db.query(
      'SELECT id, email, role, emailVerified, createdAt FROM Users WHERE id = ?',
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    let profileData = { ...user };

    if (userRole === 'STUDENT') {
      const [students] = await db.query(
        `SELECT 
          firstName, middleName, lastName,
          DATE_FORMAT(dateOfBirth, '%Y-%m-%d') as dateOfBirth,
          nid, studentId, phone, presentAddress
        FROM Student WHERE userId = ?`,
        [userId]
      );
      profileData = { ...profileData, ...students[0], address: students[0]?.presentAddress };
      delete profileData.presentAddress;
    } else if (userRole === 'UNIVERSITY') {
      const [institutions] = await db.query(
        `SELECT 
          name, registrationNumber, address,
          phone, website, authorityName, authorityTitle
        FROM Institution WHERE userId = ?`,
        [userId]
      );
      profileData = { ...profileData, ...institutions[0] };
    } else if (userRole === 'VERIFIER') {
      const [verifiers] = await db.query(
        `SELECT 
          companyName, companyRegistration, website,
          purpose, contactPhone, isApproved
        FROM Verifiers WHERE userId = ?`,
        [userId]
      );
      profileData = { ...profileData, ...verifiers[0] };
    }

    return res.json({ profile: profileData });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const updates = { ...req.body };

    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.nid;
    delete updates.dateOfBirth;
    delete updates.studentId;
    delete updates.registrationNumber;
    delete updates.isApproved;
    delete updates.emailVerified;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (userRole === 'STUDENT') {
      const allowedFields = ['firstName', 'middleName', 'lastName', 'phone', 'address'];
      const updateData = {};

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          updateData[field === 'address' ? 'presentAddress' : field] = updates[field];
        }
      });

      if (Object.keys(updateData).length > 0) {
        const setClause = Object.keys(updateData).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        await db.query(
          `UPDATE Student SET ${setClause}, updatedAt = NOW() WHERE userId = ?`,
          [...values, userId]
        );
      }
    } else if (userRole === 'UNIVERSITY') {
      const allowedFields = ['name', 'address', 'phone', 'website', 'authorityName', 'authorityTitle'];
      const updateData = {};

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      if (Object.keys(updateData).length > 0) {
        const setClause = Object.keys(updateData).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        await db.query(
          `UPDATE Institution SET ${setClause}, updatedAt = NOW() WHERE userId = ?`,
          [...values, userId]
        );
      }
    } else if (userRole === 'VERIFIER') {
      const allowedFields = ['companyName', 'website', 'contactPhone'];
      const updateData = {};

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      if (Object.keys(updateData).length > 0) {
        const setClause = Object.keys(updateData).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        await db.query(
          `UPDATE Verifiers SET ${setClause}, updatedAt = NOW() WHERE userId = ?`,
          [...values, userId]
        );
      }
    } else if (userRole === 'ADMIN') {
      const allowedFields = ['name'];
      const updateData = {};

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      if (Object.keys(updateData).length > 0) {
        const setClause = Object.keys(updateData).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        await db.query(
          `UPDATE Admins SET ${setClause}, updatedAt = NOW() WHERE id = ?`,
          [...values, userId]
        );
      }
    }

    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    let tableName = 'Users';
    let idColumn = 'id';
    if (userRole === 'ADMIN') {
      tableName = 'Admins';
      idColumn = 'id';
    }

    const [users] = await db.query(
      `SELECT password, email FROM ${tableName} WHERE ${idColumn} = ?`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query(
      `UPDATE ${tableName} SET password = ?, updatedAt = NOW() WHERE ${idColumn} = ?`,
      [hashedPassword, userId]
    );

    const mailOptions = {
      from: 'EduAuth Registry <eduauthregistry@gmail.com>',
      to: users[0].email,
      subject: 'Password Changed - EduAuth Registry',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Password Changed Successfully</h2>
          <p>Your password has been changed successfully.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
            Changed on: ${new Date().toLocaleString()}<br>
            IP Address: ${req.ip}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [users] = await db.query(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.json({ message: 'If an account exists, a reset link has been sent' });
    }

    const userId = users[0].id;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db.query(
      'INSERT INTO PasswordResetTokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, hashedToken, expiresAt]
    );

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: 'EduAuth Registry <eduauthregistry@gmail.com>',
      to: email,
      subject: 'Password Reset - EduAuth Registry',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
          <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
            Or copy this link:<br>
            ${resetUrl}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const [tokens] = await db.query(
      'SELECT userId, expiresAt, isUsed FROM PasswordResetTokens WHERE token = ? ORDER BY createdAt DESC LIMIT 1',
      [hashedToken]
    );

    if (!tokens.length) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const tokenData = tokens[0];
    if (tokenData.isUsed) {
      return res.status(400).json({ error: 'Reset token already used' });
    }
    if (new Date() > new Date(tokenData.expiresAt)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query(
      'UPDATE Users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, tokenData.userId]
    );
    await db.query(
      'UPDATE PasswordResetTokens SET isUsed = TRUE WHERE token = ?',
      [hashedToken]
    );

    return res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

async function requestEmailChange(req, res) {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { newEmail } = req.body;

    if (userRole === 'ADMIN') {
      return res.status(400).json({ error: 'Email change is not available for admin accounts' });
    }

    if (!newEmail) {
      return res.status(400).json({ error: 'New email is required' });
    }

    const [existing] = await db.query(
      'SELECT id FROM Users WHERE email = ? AND id != ?',
      [newEmail, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await db.query(
      'INSERT INTO EmailChangeRequests (id, userId, newEmail, verificationCode, expiresAt) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, newEmail, code, expiresAt]
    );

    await sendVerificationEmail(newEmail, code);

    return res.json({
      message: 'Verification code sent to new email address',
      expiresIn: 600
    });
  } catch (error) {
    console.error('Email change request error:', error);
    return res.status(500).json({ error: 'Failed to request email change' });
  }
}

async function verifyEmailChange(req, res) {
  try {
    const userId = req.user.userId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Verification code required' });
    }

    const [requests] = await db.query(
      'SELECT id, newEmail, expiresAt, isUsed FROM EmailChangeRequests WHERE userId = ? AND verificationCode = ? ORDER BY createdAt DESC LIMIT 1',
      [userId, code]
    );

    if (!requests.length) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const request = requests[0];
    if (request.isUsed) {
      return res.status(400).json({ error: 'Code already used' });
    }
    if (new Date() > new Date(request.expiresAt)) {
      return res.status(400).json({ error: 'Code has expired' });
    }

    await db.query(
      'UPDATE Users SET email = ?, emailVerified = TRUE, updatedAt = NOW() WHERE id = ?',
      [request.newEmail, userId]
    );
    await db.query(
      'UPDATE EmailChangeRequests SET isUsed = TRUE WHERE id = ?',
      [request.id]
    );

    return res.json({ message: 'Email changed successfully', newEmail: request.newEmail });
  } catch (error) {
    console.error('Verify email change error:', error);
    return res.status(500).json({ error: 'Failed to verify email change' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  requestEmailChange,
  verifyEmailChange
};

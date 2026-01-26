// Minimal email service stub for notifications
// Replace with real implementation (e.g., nodemailer) when available

const logger = require('./logger');

async function sendEmail(to, subject, message) {
  if (!to || !subject || !message) {
    throw new Error('Missing email fields');
  }
  // In production, integrate with a real email provider
  logger.debug('[EmailService] Sending email:', { to, subject, message });
  return { success: true };
}

module.exports = { sendEmail };
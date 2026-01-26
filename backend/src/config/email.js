const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration from environment variables
const SMTP_USER = process.env.SMTP_USER || 'eduauthregistry@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Validate email configuration
if (!SMTP_PASS) {
  console.warn('⚠️  SMTP_PASS not configured. Email features may not work.');
}

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS || 'nlaahpwxuozmlvot' // Fallback for development only
  }
});

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: 'EduAuth Registry <eduauthregistry@gmail.com>',
    to: email,
    subject: 'Verify Your EduAuth Registry Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E40AF;">Email Verification</h2>
        <p>Thank you for registering with EduAuth Registry.</p>
        <p>Your verification code is:</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1E40AF; font-size: 36px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #6B7280; font-size: 12px;">EduAuth Registry - Digital Certificate Verification System</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendAdminNotification(userType, userData) {
  const mailOptions = {
    from: 'EduAuth Registry <eduauthregistry@gmail.com>',
    to: 'admin@eduauth.gov.bd',
    subject: `New ${userType} Registration Pending Approval`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">New Registration Pending Approval</h2>
        <p>A new ${userType} has completed email verification and is awaiting approval.</p>
        <div style="background: #F3F4F6; padding: 15px; margin: 20px 0;">
          <p><strong>Type:</strong> ${userType}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          ${userType === 'Student' ? `
            <p><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</p>
            <p><strong>NID:</strong> ${userData.nid}</p>
            <p><strong>Date of Birth:</strong> ${userData.dateOfBirth}</p>
          ` : userType === 'University' ? `
            <p><strong>Institution:</strong> ${userData.name}</p>
            <p><strong>Registration Number:</strong> ${userData.registrationNumber}</p>
            <p><strong>City:</strong> ${userData.city}</p>
          ` : `
            <p><strong>Company:</strong> ${userData.companyName}</p>
            <p><strong>Purpose:</strong> ${userData.purpose}</p>
            <p><strong>Phone:</strong> ${userData.contactPhone}</p>
          `}
        </div>
        <p>Please log in to the admin panel to approve or reject this registration.</p>
        <a href="${FRONTEND_URL}/admin/pending-approvals" style="display: inline-block; background: #1E40AF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Review Registration</a>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendApprovalEmail(email, userType) {
  const mailOptions = {
    from: 'EduAuth Registry <eduauthregistry@gmail.com>',
    to: email,
    subject: 'Your EduAuth Account Has Been Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Account Approved!</h2>
        <p>Great news! Your ${userType} account has been approved by the administrator.</p>
        <p>You can now log in and start using EduAuth Registry.</p>
        <a href="${FRONTEND_URL}/login" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login Now</a>
        <p>If you have any questions, please contact support.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendCertificateIssuedEmail(studentEmail, certificateData) {
  const mailOptions = {
    from: 'EduAuth Registry <eduauthregistry@gmail.com>',
    to: studentEmail,
    subject: 'Certificate Issued - EduAuth Registry',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">New Certificate Issued</h2>
        <p>Congratulations! A new certificate has been issued to you.</p>
        <div style="background: #F3F4F6; padding: 15px; margin: 20px 0;">
          <p><strong>Serial Number:</strong> <span style="font-family: monospace; font-size: 18px; color: #1E40AF;">${certificateData.serial}</span></p>
          <p><strong>Certificate:</strong> ${certificateData.certificateName}</p>
          <p><strong>Level:</strong> ${certificateData.certificateLevel}</p>
          <p><strong>Institution:</strong> ${certificateData.institutionName}</p>
          <p><strong>Issue Date:</strong> ${certificateData.issueDate}</p>
        </div>
        <p>You can view your certificate in your dashboard.</p>
        <a href="${FRONTEND_URL}/student/certificates" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">View Certificate</a>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendCertificateRequestEmail(studentEmail, requestData) {
  const mailOptions = {
    from: 'EduAuth Registry <eduauthregistry@gmail.com>',
    to: studentEmail,
    subject: 'New Certificate Access Request - EduAuth Registry',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">New Access Request</h2>
        <p>A verifier has requested access to your certificates.</p>
        <div style="background: #F3F4F6; padding: 15px; margin: 20px 0;">
          <p><strong>Company:</strong> ${requestData.companyName}</p>
          <p><strong>Purpose:</strong> ${requestData.purpose}</p>
          <p><strong>Request Type:</strong> ${requestData.requestType === 'ALL_CERTIFICATES' ? 'All Certificates' : 'Single Certificate'}</p>
          ${requestData.certificateSerial ? `<p><strong>Certificate:</strong> ${requestData.certificateSerial}</p>` : ''}
          <p><strong>Reason:</strong> ${requestData.reason}</p>
        </div>
        <p>Please review this request in your dashboard.</p>
        <a href="${FRONTEND_URL}/student/certificate-requests" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Review Request</a>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendRequestApprovedEmail(verifierEmail, requestData) {
  const mailOptions = {
    from: 'EduAuth Registry <eduauthregistry@gmail.com>',
    to: verifierEmail,
    subject: 'Certificate Access Request Approved - EduAuth Registry',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Access Request Approved</h2>
        <p>The student has approved your certificate access request.</p>
        <div style="background: #F3F4F6; padding: 15px; margin: 20px 0;">
          <p><strong>Student:</strong> ${requestData.studentName}</p>
          <p><strong>Access Type:</strong> ${requestData.requestType === 'ALL_CERTIFICATES' ? 'All Certificates' : 'Single Certificate'}</p>
          <p><strong>Valid Until:</strong> ${requestData.expiresAt}</p>
        </div>
        <p>You can now view the certificates.</p>
        <a href="${FRONTEND_URL}/verifier/active-access" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">View Certificates</a>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendRequestRejectedEmail(verifierEmail, requestData) {
  const mailOptions = {
    from: 'EduAuth Registry <eduauthregistry@gmail.com>',
    to: verifierEmail,
    subject: 'Certificate Access Request Rejected - EduAuth Registry',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Access Request Rejected</h2>
        <p>Unfortunately, the student has rejected your certificate access request.</p>
        <div style="background: #F3F4F6; padding: 15px; margin: 20px 0;">
          <p><strong>Student:</strong> ${requestData.studentName}</p>
          ${requestData.rejectionReason ? `<p><strong>Reason:</strong> ${requestData.rejectionReason}</p>` : ''}
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendAdminNotification,
  sendApprovalEmail,
  sendCertificateIssuedEmail,
  sendCertificateRequestEmail,
  sendRequestApprovedEmail,
  sendRequestRejectedEmail,
  transporter
};

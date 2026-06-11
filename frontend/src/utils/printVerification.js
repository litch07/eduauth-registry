import html2pdf from 'html2pdf.js';

const getVerificationContent = (result) => {
  const isVerified = result.verified;
  const isRevoked = result.status === 'revoked';
  const cert = result.certificate || {};

  const statusHtml = isVerified 
    ? `<div class="status success">✓ Certificate Verified Successfully</div>`
    : isRevoked
    ? `<div class="status error">⚠️ Certificate Revoked</div>`
    : `<div class="status error">❌ Verification Failed</div>`;

  const detailsHtml = isVerified ? `
    <div class="row"><span class="label">Serial Number</span><span class="value">${cert.serial || 'N/A'}</span></div>
    <div class="row"><span class="label">Student Name</span><span class="value">${cert.student_name || 'N/A'}</span></div>
    <div class="row"><span class="label">Student ID</span><span class="value">${cert.student_id || 'N/A'}</span></div>
    <div class="row"><span class="label">Degree Title</span><span class="value">${cert.certificate_level || cert.degree_title || 'N/A'}</span></div>
    <div class="row"><span class="label">Program</span><span class="value">${cert.program || cert.program_name || 'N/A'}</span></div>
    <div class="row"><span class="label">Major</span><span class="value">${cert.major || 'N/A'}</span></div>
    <div class="row"><span class="label">CGPA</span><span class="value">${cert.cgpa || 'N/A'}</span></div>
    <div class="row"><span class="label">Registration No</span><span class="value">${cert.registration_no || 'N/A'}</span></div>
    <div class="row"><span class="label">Issue Date</span><span class="value">${cert.issue_date || 'N/A'}</span></div>
    <div class="row"><span class="label">Completion Date</span><span class="value">${cert.completion_date || 'N/A'}</span></div>
    <div class="row"><span class="label">Institution</span><span class="value">${cert.institution || 'N/A'}</span></div>
  ` : isRevoked ? `
    <div class="row"><span class="label">Revoked On</span><span class="value">${result.revoked_at || 'N/A'}</span></div>
    <div class="row"><span class="label">Revoked By</span><span class="value">${result.revoked_by || 'N/A'}</span></div>
    ${result.revocation_reason ? `<div class="row"><span class="label">Reason</span><span class="value">${result.revocation_reason}</span></div>` : ''}
  ` : `
    <div style="text-align: center; color: #4b5563; margin-top: 20px;">
      ${result.message || 'No certificate found with the provided details.'}
    </div>
  `;

  return `
    <div class="page-border">
      <div class="watermark">EDUAUTH VERIFIED</div>
      <div class="content-wrapper">
        <div class="header-container">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="45" height="45">
              <path fill="#2563eb" d="M 60 10 L 110 30 L 60 50 L 10 30 Z" />
              <path fill="#2563eb" d="M 20 43 L 60 59 L 100 43 L 100 70 C 100 95, 75 107, 60 110 C 45 107, 20 95, 20 70 Z" />
              <path fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M 44 77 L 54 87 L 76 63" />
            </svg>
          </div>
          <div class="header">Eduauth Registry</div>
        </div>
        <div class="subtitle">Secure Academic Credential Verification Platform</div>
        
        <div class="title">Official Verification Report</div>
        
        ${statusHtml}
        
        <div class="details-box">
          ${detailsHtml}
        </div>
        
        <div class="footer">
          This document confirms the verification status of the requested certificate in the Eduauth platform.
          <br />Report Generated on ${new Date().toLocaleString()}
          <br /><strong>eduauth.app</strong>
        </div>
      </div>
    </div>
  `;
};

const getStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @page {
    size: A4 portrait;
    margin: 1cm;
  }
  body { 
    font-family: 'Inter', sans-serif; 
    padding: 20px; 
    color: #111827; 
    background-color: #f9fafb;
    margin: 0;
  }
  .page-border {
    border: 8px solid #2563eb;
    padding: 30px;
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    position: relative;
    box-sizing: border-box;
  }
  .header-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 5px;
  }
  .logo {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .header { 
    text-align: center;
    font-size: 28px; 
    font-weight: 800; 
    color: #2563eb; 
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0; 
  }
  .subtitle {
    text-align: center;
    font-size: 14px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
  }
  .title { 
    text-align: center;
    font-size: 32px; 
    font-weight: 700; 
    margin-bottom: 20px; 
    color: #1f2937;
  }
  .status { 
    text-align: center;
    font-size: 20px; 
    font-weight: 700; 
    margin-bottom: 20px; 
    padding: 12px;
    border-radius: 8px;
  }
  .status.success { color: #15803d; background-color: #f0fdf4; border: 1px solid #bbf7d0; }
  .status.error { color: #b91c1c; background-color: #fef2f2; border: 1px solid #fecaca; }
  
  .details-box {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 15px 25px;
    background: #fdfdfd;
  }
  .row { 
    display: flex; 
    justify-content: space-between; 
    padding: 11px 0; 
    border-bottom: 1px dashed #e5e7eb; 
  }
  .row:last-child { border-bottom: none; }
  .label { color: #6b7280; font-weight: 500; font-size: 14px; }
  .value { font-weight: 600; font-size: 14px; color: #111827; text-align: right; max-width: 60%; }
  
  .footer { 
    margin-top: 30px; 
    text-align: center;
    font-size: 12px; 
    color: #9ca3af; 
    border-top: 1px solid #e5e7eb;
    padding-top: 15px;
  }
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 120px;
    font-weight: 900;
    color: rgba(37, 99, 235, 0.03);
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
  }
  .content-wrapper {
    position: relative;
    z-index: 1;
  }
  @media print {
    body { background: white; padding: 0; }
    .page-border { box-shadow: none; border-color: #4b5563; max-width: 100%; padding: 20px; }
    .status.success { background-color: transparent !important; color: #15803d !important; }
    .status.error { background-color: transparent !important; color: #b91c1c !important; }
    .watermark { color: rgba(0, 0, 0, 0.04) !important; }
  }
`;

export const printVerificationReport = (result) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert("Please allow popups to print the verification report.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Verification Report - Eduauth Registry</title>
        <style>
          ${getStyles()}
        </style>
      </head>
      <body>
        ${getVerificationContent(result)}
        <script>
          window.onload = function() { 
            setTimeout(() => {
              window.print(); 
              window.onafterprint = function() { window.close(); }
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const downloadVerificationPDF = (result) => {
  const element = document.createElement('div');
  element.innerHTML = `
    <style>${getStyles()}</style>
    <div style="width: 100%; max-width: 800px; padding: 20px; box-sizing: border-box; font-family: 'Inter', sans-serif;">
      ${getVerificationContent(result)}
    </div>
  `;

  const cert = result.certificate || {};
  const filename = cert.serial ? `verification_report_${cert.serial}.pdf` : 'verification_report.pdf';
  const opt = {
    margin:       [5, 10, 5, 10],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};

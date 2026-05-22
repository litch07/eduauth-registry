<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Issued</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.95;
        }
        .content {
            padding: 40px 20px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .certificate-box {
            background-color: #f0f9ff;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .certificate-details {
            margin: 15px 0;
        }
        .detail-row {
            display: flex;
            margin: 12px 0;
            border-bottom: 1px solid #dbeafe;
            padding-bottom: 12px;
        }
        .detail-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #1e40af;
            width: 140px;
            flex-shrink: 0;
        }
        .detail-value {
            color: #1f2937;
            flex-grow: 1;
        }
        .serial-number {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: 700;
            color: #2563eb;
            letter-spacing: 1px;
        }
        .info-box {
            background-color: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #15803d;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.3s ease;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e5e7eb;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                width: 100%;
                margin-bottom: 5px;
            }
            .cta-button {
                display: block;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Certificate Issued</h1>
            <p>Congratulations on your achievement!</p>
        </div>

        <div class="content">
            <div class="greeting">Hello {{ $studentName }},</div>

            <p>We're pleased to inform you that your certificate has been successfully issued by {{ $institutionName }}. This is a significant milestone in your academic journey!</p>

            <div class="certificate-box">
                <div class="certificate-details">
                    <div class="detail-row">
                        <div class="detail-label">Degree</div>
                        <div class="detail-value">{{ $degree }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Institution</div>
                        <div class="detail-value">{{ $institutionName }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Serial Number</div>
                        <div class="detail-value"><span class="serial-number">{{ $serial }}</span></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Issued On</div>
                        <div class="detail-value">{{ date('F j, Y') }}</div>
                    </div>
                </div>
            </div>

            <div class="info-box">
                <strong>What's next?</strong>
                <p>Your certificate is now available in your dashboard. You can:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Download the certificate PDF</li>
                    <li>Share it with employers</li>
                    <li>Control who can view your certificate (Public/Private)</li>
                    <li>Share the verification link with others</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{{ $verificationUrl }}" class="cta-button">View Certificate</a>
            </div>

            <p>If you have any questions about your certificate, please contact {{ $institutionName }} or reply to this email.</p>

            <div class="divider"></div>
            <p style="font-size: 14px; color: #666;">Best regards,<br><strong>EduAuth Registry Team</strong></p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} EduAuth Registry. All rights reserved.</p>
            <p>This is an automated email. Please do not reply with sensitive information.</p>
        </div>
    </div>
</body>
</html>

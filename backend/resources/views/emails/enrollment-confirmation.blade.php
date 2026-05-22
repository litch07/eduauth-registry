<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enrollment Confirmation</title>
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
        .enrollment-box {
            background-color: #f0f9ff;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .enrollment-details {
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
        .status-badge {
            display: inline-block;
            background-color: #dcfce7;
            color: #15803d;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .info-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #b45309;
        }
        .info-box ul {
            margin: 10px 0 0 0;
            padding-left: 20px;
        }
        .info-box li {
            margin: 5px 0;
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
            <h1>📚 Enrollment Confirmed</h1>
            <p>Welcome to {{ $institutionName }}!</p>
        </div>

        <div class="content">
            <div class="greeting">Hello {{ $studentName }},</div>

            <p>Your enrollment at {{ $institutionName }} has been successfully confirmed. You are now ready to begin your academic journey with us!</p>

            <div class="enrollment-box">
                <div class="enrollment-details">
                    <div class="detail-row">
                        <div class="detail-label">Institution</div>
                        <div class="detail-value">{{ $institutionName }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Program</div>
                        <div class="detail-value">{{ $program }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Status</div>
                        <div class="detail-value"><span class="status-badge">{{ $status }}</span></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Enrollment Date</div>
                        <div class="detail-value">{{ date('F j, Y') }}</div>
                    </div>
                </div>
            </div>

            <div class="info-box">
                <strong>Next Steps:</strong>
                <ul>
                    <li>Log in to your dashboard to view your profile</li>
                    <li>Complete your profile information if not already done</li>
                    <li>Monitor for certificates issued to you</li>
                    <li>Keep your contact information up to date</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{{ $dashboardUrl }}" class="cta-button">Go to Dashboard</a>
            </div>

            <p>If you have any questions about your enrollment or need assistance, please contact {{ $institutionName }} directly or reply to this email.</p>

            <div class="divider"></div>
            <p style="font-size: 14px; color: #666;">Welcome aboard!<br><strong>EduAuth Registry Team</strong></p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} EduAuth Registry. All rights reserved.</p>
            <p>This is an automated email. Please do not reply with sensitive information.</p>
        </div>
    </div>
</body>
</html>

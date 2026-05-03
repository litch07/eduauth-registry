<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
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
        .content {
            padding: 40px 20px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .code-section {
            background-color: #f0f9ff;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .code {
            font-size: 48px;
            font-weight: 700;
            color: #2563eb;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 0;
        }
        .info-box {
            background-color: #fff7ed;
            border-left: 4px solid #f97316;
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
            font-size: 14px;
        }
        .footer {
            background-color: #f8f9fa;
            border-top: 1px solid #eee;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer p {
            margin: 5px 0;
        }
        a {
            color: #2563eb;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EduAuth Registry</h1>
        </div>

        <div class="content">
            <div class="greeting">
                <p>Hello <strong>{{ $userName }}</strong>,</p>
                <p>Thank you for registering with <strong>EduAuth Registry</strong>. To complete your email verification, please use the verification code below:</p>
            </div>

            <div class="code-section">
                <div class="code-label">Your Verification Code:</div>
                <div class="code">{{ $verificationCode }}</div>
            </div>

            <div class="info-box">
                <strong>Important:</strong>
                <ul>
                    <li>This code will expire in <strong>10 minutes</strong></li>
                    <li>Do not share this code with anyone</li>
                    <li>We will never ask you for this code via email or phone</li>
                </ul>
            </div>

            <p>After verifying your email, your account will be pending admin approval. You will receive a notification email once your account is approved.</p>
            <p>If you did not register for this account, please ignore this email.</p>
        </div>

        <div class="footer">
            <p><strong>&copy; 2024 EduAuth Registry. All rights reserved.</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, please contact us at <a href="mailto:support@eduauth.com">support@eduauth.com</a></p>
        </div>
    </div>
</body>
</html>
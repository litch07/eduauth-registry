<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Rejected</title>
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
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .badge {
            display: inline-block;
            background-color: #fee2e2;
            color: #991b1b;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 10px;
        }
        .content { padding: 40px 20px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .reason-box {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white !important;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            border-top: 1px solid #eee;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EduAuth Registry</h1>
            <div class="badge">✗ Registration Rejected</div>
        </div>

        <div class="content">
            <div class="greeting">
                <p>Hello <strong>{{ $userName }}</strong>,</p>
                <p>Unfortunately, your registration for EduAuth Registry has been <strong>rejected</strong> by the admin.</p>
            </div>

            @if($rejectionReason)
            <div class="reason-box">
                <strong>Reason:</strong>
                <p>{{ $rejectionReason }}</p>
            </div>
            @endif

            <div style="text-align: center;">
                <p>You can try registering again with updated information.</p>
                <a href="{{ $registerUrl }}" class="cta-button">Register Again →</a>
            </div>

            <p>If you have questions about the rejection, please contact our support team for assistance.</p>
        </div>

        <div class="footer">
            <p><strong>&copy; 2024 EduAuth Registry. All rights reserved.</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
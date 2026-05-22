<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Revoked</title>
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
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
        .reason-box {
            background-color: #fee2e2;
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .reason-label {
            font-size: 14px;
            color: #991b1b;
            margin-bottom: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .reason {
            font-size: 16px;
            color: #b91c1c;
            margin: 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Certificate Revoked</h1>
        </div>

        <div class="content">
            <p class="greeting">Dear {{ $user->name }},</p>
            <p>This is a notification that your certificate with serial number <strong>{{ $certificate->serial }}</strong> has been revoked.</p>
            <p>This action is permanent and cannot be undone.</p>
            
            <div class="reason-box">
                <p class="reason-label">Reason for revocation:</p>
                <p class="reason">{{ $certificate->revocation_reason }}</p>
            </div>

            <p>If you have any questions, please contact the issuing institution.</p>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} EduAuth Registry. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

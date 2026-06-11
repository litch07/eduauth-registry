<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'EduAuth Registry')</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f3f4f6;
            padding-bottom: 40px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            margin-top: 40px;
        }
        .header {
            background-color: #6366f1; /* Indigo 500 */
            background-image: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo-container {
            margin-bottom: 15px;
        }
        .logo-container svg {
            width: 64px;
            height: 64px;
            display: inline-block;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.025em;
        }
        .header p {
            margin: 5px 0 0;
            color: #e0e7ff; /* Indigo 100 */
            font-size: 15px;
        }
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
        }
        .greeting {
            font-size: 18px;
            color: #111827;
            margin-bottom: 24px;
            font-weight: 500;
        }
        .greeting strong {
            font-weight: 700;
            color: #4f46e5;
        }
        .text-body {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 24px;
            line-height: 1.625;
        }
        
        /* Highlight / Code Section */
        .highlight-box {
            background-color: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .highlight-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .highlight-value {
            font-size: 42px;
            font-weight: 800;
            color: #4f46e5;
            letter-spacing: 0.15em;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            margin: 0;
        }

        /* Buttons */
        .btn-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }
        .btn:hover {
            background-color: #4338ca;
        }

        /* Info Boxes */
        .info-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box.danger {
            background-color: #fef2f2;
            border-left-color: #ef4444;
        }
        .info-box.success {
            background-color: #f0fdf4;
            border-left-color: #22c55e;
        }
        .info-box.neutral {
            background-color: #f3f4f6;
            border-left-color: #6b7280;
        }
        .info-box strong {
            display: block;
            margin-bottom: 8px;
            font-size: 15px;
        }
        .info-box.danger strong { color: #b91c1c; }
        .info-box.success strong { color: #15803d; }
        .info-box.neutral strong { color: #374151; }
        .info-box ul {
            margin: 0;
            padding-left: 20px;
            color: #4b5563;
        }
        .info-box li {
            margin: 4px 0;
            font-size: 14px;
        }

        /* Key Value Data */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            background-color: #f8fafc;
            border-radius: 8px;
            overflow: hidden;
        }
        .data-table th, .data-table td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .data-table th {
            font-weight: 600;
            color: #475569;
            width: 35%;
            font-size: 14px;
        }
        .data-table td {
            color: #1e293b;
            font-weight: 500;
            font-size: 15px;
        }
        .data-table tr:last-child th, .data-table tr:last-child td {
            border-bottom: none;
        }

        /* Footer */
        .footer {
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 24px 30px;
            text-align: center;
        }
        .footer p {
            margin: 8px 0;
            font-size: 13px;
            color: #6b7280;
        }
        .footer a {
            color: #6366f1;
            text-decoration: none;
            font-weight: 500;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo-container">
                    <!-- Inline SVG Logo for universal email support (as close as possible without external links) -->
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="64" height="64">
                        <path fill="#ffffff" d="M 60 10 L 110 30 L 60 50 L 10 30 Z" />
                        <path fill="#ffffff" opacity="0.8" d="M 20 43 L 60 59 L 100 43 L 100 70 C 100 95, 75 107, 60 110 C 45 107, 20 95, 20 70 Z" />
                        <path fill="none" stroke="#6366f1" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M 44 77 L 54 87 L 76 63" />
                    </svg>
                </div>
                <h1>EduAuth Registry</h1>
                <p>Securing Academic Credentials</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                @yield('content')
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>&copy; {{ date('Y') }} EduAuth Registry. All rights reserved.</strong></p>
                <p>This is an automated message generated by our system. Please do not reply directly to this email.</p>
                <p>Need help? Contact our support team at <a href="mailto:support@eduauth.com">support@eduauth.com</a></p>
            </div>
        </div>
    </div>
</body>
</html>

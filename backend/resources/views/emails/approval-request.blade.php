<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Verified Registration</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; color: #1f2937; margin: 0; padding: 0; }
        .container { max-width: 640px; margin: 24px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; padding: 32px; }
        .content { padding: 32px; line-height: 1.7; }
        .card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 18px 0; }
        .label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin-bottom: 4px; }
        .value { font-weight: 600; color: #111827; }
        .footer { padding: 20px 32px 32px; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0;font-size:28px;">EduAuth Registry</h1>
            <p style="margin:8px 0 0;">A new account has verified their email and is waiting for approval.</p>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            <p>The following registration is now ready for review:</p>

            <div class="card">
                <span class="label">Email</span>
                <div class="value">{{ $user->email }}</div>
            </div>

            <div class="card">
                <span class="label">Role</span>
                <div class="value">{{ strtoupper($user->role) }}</div>
            </div>

            @if($user->student)
                <div class="card">
                    <span class="label">Student</span>
                    <div class="value">{{ $user->student->full_name }}</div>
                    <div style="margin-top:8px;" class="value">Student ID: {{ $user->student->student_id }}</div>
                </div>
            @elseif($user->institution)
                <div class="card">
                    <span class="label">University</span>
                    <div class="value">{{ $user->institution->name }}</div>
                    <div style="margin-top:8px;" class="value">Registration No: {{ $user->institution->registration_number }}</div>
                </div>
            @elseif($user->verifier)
                <div class="card">
                    <span class="label">Verifier</span>
                    <div class="value">{{ $user->verifier->company_name }}</div>
                    <div style="margin-top:8px;" class="value">Contact: {{ $user->verifier->contact_person }}</div>
                </div>
            @endif

            <p>Please review this registration in the admin panel and approve or reject it as appropriate.</p>
        </div>
        <div class="footer">
            This is an automated notification from EduAuth Registry.
        </div>
    </div>
</body>
</html>
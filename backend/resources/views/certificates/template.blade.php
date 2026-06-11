<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Certificate</title>
    <style>
        @page {
            margin: 40px;
            size: A4 landscape;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', serif;
            color: #333333;
        }
        .certificate-container {
            border: 8px solid #0d2b5e;
            padding: 10px;
            height: 660px;
        }
        .certificate-inner {
            border: 2px solid #bda853;
            height: 656px;
            padding: 0;
            margin: 0;
            text-align: center;
            position: relative;
        }
        .header {
            margin-top: 60px;
            font-size: 38px;
            font-weight: bold;
            color: #0d2b5e;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .title {
            margin-top: 20px;
            font-size: 48px;
            font-style: italic;
            color: #bda853;
        }
        .student-name {
            font-size: 26px;
            font-weight: bold;
            color: #111;
        }
        .certificate-text {
            font-family: 'Times New Roman', serif;
            font-size: 24px;
            line-height: 40px; /* clear gap between lines */
            color: #334155;
            margin: 35px auto 0;
            width: 80%;
            text-align: center;
        }
        .certificate-meta {
            font-family: 'Times New Roman', serif;
            font-size: 20px;
            line-height: 29px;
            color: #334155;
            margin: 14px auto 0;
            width: 80%;
            text-align: center;
        }
        table.footer {
            width: 100%;
            margin: 35px auto 0;
        }
        table.footer td {
            vertical-align: bottom;
            width: 50%;
        }
        .footer-block-left {
            width: 220px;
            margin-left: 15px;
            text-align: center;
        }
        .footer-block-right {
            width: 260px;
            margin-right: 15px;
            margin-left: auto;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 220px;
            margin: 0 auto 12px;
        }
        .signature-text {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 15px;
            font-weight: bold;
            color: #0d2b5e;
            line-height: 22px;
        }
        .signature-sub {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 13px;
            color: #555;
            line-height: 20px;
            margin-top: 6px;
        }
        .qr-code img {
            width: 100px;
            height: 100px;
            margin-bottom: 8px;
        }
        .serial-text {
            font-family: monospace;
            font-size: 13px;
            color: #777;
            margin-top: 12px;
        }
        .top-left-date {
            position: absolute;
            top: 15px;
            left: 15px;
            text-align: left;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 13px;
            color: #555;
            line-height: 18px;
        }
        .top-right-date {
            position: absolute;
            top: 15px;
            right: 15px;
            text-align: right;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 13px;
            color: #555;
            line-height: 18px;
        }
        .date-label {
            font-size: 14px;
            font-weight: bold;
            color: #0d2b5e;
            margin-right: 4px;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate-inner">
            <div class="top-left-date">
                @if($certificate->convocation_date)
                    <span class="date-label">Convocation Date:</span>
                    {{ $certificate->convocation_date->format('F j, Y') }}
                @endif
            </div>

            <div class="top-right-date">
                <span class="date-label">Issue Date:</span>
                {{ $certificate->issue_date->format('F j, Y') }}
            </div>

            <div class="header">{{ $institution->name }}</div>

            <div class="title">Certificate of Achievement</div>

            <div class="certificate-text">
                This is to certify that <span class="student-name">{{ $student->user->name }}</span> has successfully completed the requirements for the degree of <strong>{{ $certificate->certificate_level }}@if($certificate->certificate_name) {{ $certificate->certificate_name }}@endif</strong>@if($certificate->major) in <strong>{{ $certificate->major }}</strong>@endif.
            </div>

            @if($certificate->enrollment && ($certificate->enrollment->roll_number || $certificate->enrollment->enrollment_number))
            <div class="certificate-meta">
                Student ID: <strong>{{ $certificate->enrollment->roll_number ?? $certificate->enrollment->enrollment_number }}</strong>
            </div>
            @endif

            @if($certificate->session)
            <div class="certificate-meta">
                Academic Session: <strong>{{ $certificate->session }}</strong>
            </div>
            @endif

            @php
                $hasClass = !empty($certificate->degree_class) && !in_array(strtolower(trim($certificate->degree_class)), ['n/a', 'none', 'null', 'na', 'not applicable', '-']);
            @endphp
            @if($certificate->cgpa || $hasClass)
            <div class="certificate-meta">
                @if($certificate->cgpa)
                    CGPA: <strong>{{ number_format($certificate->cgpa, 2) }}</strong>/4.00
                @endif
                @if($certificate->cgpa && $hasClass)
                    &nbsp;|&nbsp;
                @endif
                @if($hasClass)
                    Class: <strong>{{ $certificate->degree_class }}</strong>
                @endif
            </div>
            @endif

            <table class="footer">
                <tr>
                    <td>
                        <div class="footer-block-left">
                            <div class="qr-code">
                                <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code">
                            </div>
                            <div class="serial-text">Serial No: {{ $certificate->serial }}</div>
                        </div>
                    </td>
                    <td>
                        <div class="footer-block-right">
                            <div class="signature-line"></div>
                            <div class="signature-text">{{ $certificate->authority_name ?? 'Issuing Authority' }}</div>
                            <div class="signature-sub">{{ $certificate->authority_title ?? 'Authorized Signatory' }}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
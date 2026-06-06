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
            padding: 6px;
            height: 640px;
        }
        .certificate-inner {
            border: 2px solid #bda853;
            height: 636px;
            padding: 0;
            margin: 0;
            text-align: center;
        }
        .header {
            margin-top: 50px;
            font-size: 36px;
            font-weight: bold;
            color: #0d2b5e;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .title {
            margin-top: 15px;
            font-size: 46px;
            font-style: italic;
            color: #bda853;
        }
        .student-name {
            font-size: 26px;
            font-weight: bold;
            color: #111;
            display: inline-block;
        }
        .certificate-text {
            font-family: 'Times New Roman', serif;
            font-size: 24px;
            line-height: 1.2;
            color: #334155;
            margin: 50px auto 0;
            width: 85%;
            text-align: center;
        }
        .certificate-meta {
            font-family: 'Times New Roman', serif;
            font-size: 20px;
            line-height: 1.2;
            color: #334155;
            margin: 15px auto 0;
            width: 85%;
            text-align: center;
        }
        table.footer {
            width: 90%;
            margin: 38px auto 0;
        }
        table.footer td {
            text-align: center;
            vertical-align: bottom;
            width: 33.33%;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin: 0 auto 5px;
        }
        .signature-text {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 14px;
            font-weight: bold;
            color: #0d2b5e;
        }
        .signature-sub {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #555;
        }
        .qr-code img {
            width: 90px;
            height: 90px;
        }
        .serial-text {
            font-family: monospace;
            font-size: 12px;
            color: #777;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate-inner">
            <div class="header">{{ $institution->name }}</div>

            <div class="title">Certificate of Achievement</div>

            <div class="certificate-text">
                This is to certify that <span class="student-name">{{ $student->user->name }}</span> has successfully completed the requirements for the degree of <strong>{{ $certificate->certificate_level }}@if($certificate->certificate_name) {{ $certificate->certificate_name }}@endif</strong>@if($certificate->major) in <strong>{{ $certificate->major }}</strong>@endif.
            </div>

            @if($certificate->session)
            <div class="certificate-meta">
                Academic Session: <strong>{{ $certificate->session }}</strong>
            </div>
            @endif

            @if($certificate->cgpa || $certificate->degree_class)
            <div class="certificate-meta">
                @if($certificate->cgpa)
                    CGPA: <strong>{{ number_format($certificate->cgpa, 2) }}</strong>/4.00
                @endif
                @if($certificate->cgpa && $certificate->degree_class)
                    &nbsp;|&nbsp;
                @endif
                @if($certificate->degree_class)
                    Class: <strong>{{ $certificate->degree_class }}</strong>
                @endif
            </div>
            @endif

            <table class="footer">
                <tr>
                    <td>
                        <div class="signature-text" style="margin-bottom: 5px;">
                            Issue Date:<br>
                            {{ $certificate->issue_date->format('F j, Y') }}
                        </div>
                        @if($certificate->convocation_date)
                        <div class="signature-sub" style="margin-top: 10px;">
                            Convocation Date:<br>
                            {{ $certificate->convocation_date->format('F j, Y') }}
                        </div>
                        @endif
                    </td>
                    <td>
                        <div class="qr-code">
                            <img src="data:image/svg+xml;base64,{{ $qrCode }}" alt="QR Code">
                        </div>
                        <div class="serial-text">Serial No: {{ $certificate->serial }}</div>
                    </td>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-text">{{ $certificate->authority_name ?? 'Issuing Authority' }}</div>
                        <div class="signature-sub">{{ $certificate->authority_title ?? 'Authorized Signatory' }}</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
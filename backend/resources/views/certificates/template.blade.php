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
        .subtitle {
            margin-top: 28px;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 15px;
            color: #555;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .student-name {
            margin-top: 12px;
            font-size: 40px;
            font-weight: bold;
            color: #111;
            border-bottom: 2px solid #cbd5e1;
            display: inline-block;
            padding-bottom: 5px;
            min-width: 300px;
        }
        .student-id {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 14px;
            color: #475569;
            margin-top: 8px;
        }
        .certificate-text {
            font-family: 'Times New Roman', serif;
            font-size: 18px;
            line-height: 1.7;
            color: #334155;
            margin: 28px auto 0;
            width: 82%;
            text-align: justify;
        }
        .certificate-text-cgpa {
            font-family: 'Times New Roman', serif;
            font-size: 18px;
            line-height: 1.7;
            color: #334155;
            margin: 10px auto 0;
            width: 82%;
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

            <div class="subtitle">This is to certify that</div>

            <div class="student-name">{{ $student->user->name }}</div>

            <div class="student-id">Student ID: <strong>{{ $student->student_id }}</strong></div>

            <div class="certificate-text">
                having successfully completed the prescribed course of study and passed the requisite examinations,
                has been duly admitted to the degree of
                <strong>{{ $certificate->certificate_level }}@if($certificate->certificate_name) of {{ $certificate->certificate_name }}@endif</strong>
                @if($certificate->major)
                    (Major in {{ $certificate->major }})
                @endif
                @if($certificate->department)
                    under the Department of <strong>{{ $certificate->department }}</strong>
                @endif
                @if($certificate->session)
                    for the Academic Session of <strong>{{ $certificate->session }}</strong>.
                @else
                    .
                @endif
            </div>

            @if($certificate->cgpa || $certificate->degree_class)
            <div class="certificate-text-cgpa">
                @if($certificate->cgpa)
                    The graduate achieved a Cumulative Grade Point Average (CGPA) of
                    <strong>{{ number_format($certificate->cgpa, 2) }}</strong> on a 4.00 scale
                    @if($certificate->degree_class)
                        and was awarded <strong>{{ $certificate->degree_class }}</strong>.
                    @else
                        .
                    @endif
                @elseif($certificate->degree_class)
                    The graduate was awarded <strong>{{ $certificate->degree_class }}</strong>.
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
@extends('emails.layout.email-layout')

@section('title', 'Certificate Issued')

@section('content')
<div class="greeting">
    <p>Hello <strong>{{ $studentName }}</strong>,</p>
</div>

<div class="text-body">
    <p>We're pleased to inform you that your certificate has been successfully issued by <strong>{{ $institutionName }}</strong>. This is a significant milestone in your academic journey!</p>
</div>

<table class="data-table">
    <tr>
        <th>Degree</th>
        <td>{{ $degree }}</td>
    </tr>
    <tr>
        <th>Institution</th>
        <td>{{ $institutionName }}</td>
    </tr>
    <tr>
        <th>Serial Number</th>
        <td><strong style="color: #4f46e5; font-family: monospace; font-size: 16px;">{{ $serial }}</strong></td>
    </tr>
    <tr>
        <th>Issued On</th>
        <td>{{ date('F j, Y') }}</td>
    </tr>
</table>

<div class="info-box success">
    <strong>What's next?</strong>
    <p style="margin: 0 0 10px 0;">Your certificate is now available in your dashboard. You can:</p>
    <ul>
        <li>Download the certificate PDF</li>
        <li>Control who can view your certificate (Public/Private)</li>
        <li>Share the verification link with employers</li>
    </ul>
</div>

<div class="btn-container">
    <a href="{{ $verificationUrl }}" class="btn">View Certificate</a>
</div>

<div class="text-body">
    <p>If you have any questions about your certificate, please contact {{ $institutionName }} directly.</p>
</div>
@endsection

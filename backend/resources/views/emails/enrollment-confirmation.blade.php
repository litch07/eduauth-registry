@extends('emails.layout.email-layout')

@section('title', 'Enrollment Confirmed')

@section('content')
<div class="greeting">
    <p>Hello <strong>{{ $studentName }}</strong>,</p>
</div>

<div class="text-body">
    <p>Your enrollment at <strong>{{ $institutionName }}</strong> has been successfully confirmed. You are now ready to begin your academic journey with us!</p>
</div>

<table class="data-table">
    <tr>
        <th>Institution</th>
        <td>{{ $institutionName }}</td>
    </tr>
    <tr>
        <th>Program</th>
        <td>{{ $program }}</td>
    </tr>
    <tr>
        <th>Status</th>
        <td><strong style="color: #15803d; background-color: #dcfce7; padding: 4px 12px; border-radius: 20px; font-size: 13px;">{{ $status }}</strong></td>
    </tr>
    <tr>
        <th>Enrollment Date</th>
        <td>{{ date('F j, Y') }}</td>
    </tr>
</table>

<div class="info-box neutral">
    <strong>Next Steps:</strong>
    <ul>
        <li>Log in to your dashboard to view your profile</li>
        <li>Complete your profile information if not already done</li>
        <li>Monitor for certificates issued to you</li>
        <li>Keep your contact information up to date</li>
    </ul>
</div>

<div class="btn-container">
    <a href="{{ $dashboardUrl }}" class="btn">Go to Dashboard</a>
</div>

<div class="text-body">
    <p>If you have any questions about your enrollment or need assistance, please contact {{ $institutionName }} directly or reply to this email.</p>
</div>
@endsection

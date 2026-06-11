@extends('emails.layout.email-layout')

@section('title', 'Account Approved')

@section('content')
<div class="greeting">
    <p>Hello <strong>{{ $userName }}</strong>,</p>
</div>

<div class="info-box success">
    <strong>Account Approved</strong>
    <ul>
        <li>Your account has been reviewed and approved by the admin.</li>
        <li>You can now log in to the EduAuth Registry platform.</li>
    </ul>
</div>

<div class="text-body">
    <p>Great news! Your account is now fully active. You can log in using your email and password to access your dashboard and start using the system.</p>
</div>

<div class="btn-container">
    <a href="{{ $loginUrl }}" class="btn">Log In Now</a>
</div>

<div class="text-body">
    <p>If you have any questions or need assistance, please do not hesitate to contact our support team.</p>
</div>
@endsection
@extends('emails.layout.email-layout')

@section('title', 'Email Verification')

@section('content')
<div class="greeting">
    <p>Hello <strong>{{ $userName }}</strong>,</p>
</div>

<div class="text-body">
    <p>Thank you for registering with <strong>EduAuth Registry</strong>. To complete your email verification, please use the verification code below:</p>
</div>

<div class="highlight-box">
    <div class="highlight-label">Your Verification Code</div>
    <div class="highlight-value">{{ $verificationCode }}</div>
</div>

<div class="info-box neutral">
    <strong>Security Notice:</strong>
    <ul>
        <li>This code will expire in <strong>10 minutes</strong></li>
        <li>Do not share this code with anyone</li>
        <li>We will never ask you for this code via email or phone</li>
    </ul>
</div>

<div class="text-body">
    <p>After verifying your email, your account will be pending admin approval. You will receive a notification email once your account is approved.</p>
    <p>If you did not register for this account, please ignore this email safely.</p>
</div>
@endsection
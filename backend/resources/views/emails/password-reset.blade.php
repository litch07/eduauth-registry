@extends('emails.layout.email-layout')

@section('title', 'Reset Your Password')

@section('content')
<div class="greeting">
    <p>Hello,</p>
</div>

<div class="text-body">
    <p>You are receiving this email because we received a password reset request for your account. If you made this request, please click the button below to choose a new password.</p>
</div>

<div class="btn-container">
    <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
</div>

<div class="info-box neutral">
    <strong>Security Notice:</strong>
    <ul>
        <li>This password reset link will expire in <strong>60 minutes</strong>.</li>
        <li>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</li>
    </ul>
</div>
@endsection

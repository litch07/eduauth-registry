@extends('emails.layout.email-layout')

@section('title', 'Confirm Your New Email Address')

@section('content')
<div class="greeting">
    <p>Hello <strong>{{ $userName }}</strong>,</p>
</div>

<div class="text-body">
    <p>You recently requested to change your email address on <strong>EduAuth Registry</strong>. To confirm this change, please click the button below:</p>
</div>

<div class="btn-container">
    <a href="{{ $verificationLink }}" class="btn">Confirm New Email Address</a>
</div>

<div class="info-box neutral">
    <strong>Important:</strong>
    <ul>
        <li>This link will expire in <strong>24 hours</strong></li>
        <li>Your current email address will remain active until you verify the new one</li>
        <li>If you did not request this change, please ignore this email — your account is safe</li>
    </ul>
</div>

<div class="text-body" style="font-size: 13px; color: #6b7280; word-break: break-all; text-align: center; margin-top: 30px;">
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <a href="{{ $verificationLink }}" style="color: #6366f1;">{{ $verificationLink }}</a>
</div>
@endsection

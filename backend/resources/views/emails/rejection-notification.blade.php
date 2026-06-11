@extends('emails.layout.email-layout')

@section('title', 'Registration Rejected')

@section('content')
<div class="greeting">
    <p>Hello <strong>{{ $userName }}</strong>,</p>
</div>

<div class="text-body">
    <p>Unfortunately, your registration for EduAuth Registry has been <strong>rejected</strong> by the admin.</p>
</div>

@if($rejectionReason)
<div class="info-box danger">
    <strong>Reason for Rejection:</strong>
    <p style="margin: 5px 0 0 0;">{{ $rejectionReason }}</p>
</div>
@endif

<div class="text-body">
    <p>You can try registering again with updated information that addresses the reason above.</p>
</div>

<div class="btn-container">
    <a href="{{ $registerUrl }}" class="btn">Register Again</a>
</div>

<div class="text-body">
    <p>If you have questions about the rejection, please contact our support team for assistance.</p>
</div>
@endsection
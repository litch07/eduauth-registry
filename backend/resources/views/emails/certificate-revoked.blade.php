@extends('emails.layout.email-layout')

@section('title', 'Certificate Revoked')

@section('content')
<div class="greeting">
    <p>Dear <strong>{{ $user->name }}</strong>,</p>
</div>

<div class="text-body">
    <p>This is a notification that your certificate with serial number <strong style="font-family: monospace;">{{ $certificate->serial }}</strong> has been revoked.</p>
</div>

<div class="info-box danger">
    <strong>Revocation Details</strong>
    <p style="margin: 0 0 10px 0;"><strong>Reason:</strong> {{ $certificate->revocation_reason }}</p>
    <ul>
        <li>This action affects the public validity of your certificate.</li>
        <li>The certificate will no longer appear as "Verified" when scanned.</li>
    </ul>
</div>

<div class="text-body">
    <p>If you believe this was done in error or if you have any questions, please contact the issuing institution directly for clarification.</p>
</div>
@endsection

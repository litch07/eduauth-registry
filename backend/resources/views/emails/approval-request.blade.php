@extends('emails.layout.email-layout')

@section('title', 'New Registration Needs Approval')

@section('content')
<div class="greeting">
    <p>Hello <strong>Admin</strong>,</p>
</div>

<div class="text-body">
    <p>A new account has successfully verified their email address and is now waiting for admin approval.</p>
    <p>Please review the registration details below:</p>
</div>

<table class="data-table">
    <tr>
        <th>Email</th>
        <td>{{ $user->email }}</td>
    </tr>
    <tr>
        <th>Role</th>
        <td><strong style="color: #4f46e5;">{{ strtoupper($user->role) }}</strong></td>
    </tr>
    @if($user->student)
    <tr>
        <th>Full Name</th>
        <td>{{ $user->student->full_name }}</td>
    </tr>
    <tr>
        <th>Student ID</th>
        <td>{{ $user->student->student_id }}</td>
    </tr>
    @elseif($user->institution)
    <tr>
        <th>University</th>
        <td>{{ $user->institution->name }}</td>
    </tr>
    <tr>
        <th>Registration No.</th>
        <td>{{ $user->institution->registration_number }}</td>
    </tr>
    @elseif($user->verifier)
    <tr>
        <th>Company</th>
        <td>{{ $user->verifier->company_name }}</td>
    </tr>
    <tr>
        <th>Contact Person</th>
        <td>{{ $user->verifier->contact_person }}</td>
    </tr>
    @endif
</table>

<div class="text-body">
    <p>Log in to your admin dashboard to approve or reject this request.</p>
</div>
@endsection
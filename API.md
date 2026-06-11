# EduAuth Registry — API Reference

**Base URL:** `/api`  
**Authentication:** Laravel Sanctum (`Authorization: Bearer <token>`)  
**Content-Type:** `application/json` (unless noted otherwise)

---

## Conventions

| Symbol | Meaning |
|--------|---------|
| `*` | Required field |
| _(Optional)_ | Field is nullable / conditionally present |
| `[Auth]` | Requires `Authorization: Bearer <token>` header |
| `[Role: X]` | Requires authenticated user with role `X` |

All authenticated routes that fail the role check return `403 Forbidden`.  
Validation failures return `422 Unprocessable Entity` with an `errors` object.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Shared — Profile & Settings](#2-shared--profile--settings)
3. [Shared — Notifications](#3-shared--notifications)
4. [Shared — Profile Change Requests](#4-shared--profile-change-requests)
5. [Shared — Certificates](#5-shared--certificates)
6. [Public Endpoints](#6-public-endpoints)
7. [Student](#7-student)
8. [University](#8-university)
9. [Verifier](#9-verifier)
10. [Admin](#10-admin)

---

## 1. Authentication

### POST `/auth/register`

Register a new user account (student, university, or verifier).

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `name` * | string | max:255 |
| `email` * | string | email, unique |
| `password` * | string | min:8, confirmed |
| `password_confirmation` * | string | — |
| `role` * | string | `student`, `university`, `verifier` |
| `first_name` * (student) | string | max:100 |
| `middle_name` (student) | string | _(Optional)_, max:100 |
| `last_name` * (student) | string | max:100 |
| `date_of_birth` * (student) | string | date, format `YYYY-MM-DD` |
| `gender` * (student) | string | `male`, `female`, `other` |
| `nid` * (student) | string | min:10, max:17 |
| `phone` (student) | string | _(Optional)_ |
| `address` (student) | string | _(Optional)_ |
| `institution_name` * (university) | string | max:255 |
| `registration_number` * (university) | string | max:100 |
| `institution_address` * (university) | string | — |
| `institution_city` * (university) | string | max:100 |
| `institution_phone` (university) | string | _(Optional)_ |
| `institution_website` (university) | string | _(Optional)_, URL |
| `company_name` * (verifier) | string | max:255 |
| `contact_person` * (verifier) | string | max:255 |
| `designation` (verifier) | string | _(Optional)_ |
| `verifier_email` * (verifier) | string | email |
| `verifier_phone` (verifier) | string | _(Optional)_ |
| `purpose` * (verifier) | string | min:20, max:1000 |
| `verifier_address` (verifier) | string | _(Optional)_ |
| `verifier_website` (verifier) | string | _(Optional)_ |

**Response `201`**

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student",
    "name": "Sadid Ahmed",
    "is_approved": false,
    "email_verified_at": null
  }
}
```

---

### POST `/auth/login`

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `email` * | string | email |
| `password` * | string | — |

**Response `200`**

```json
{
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student",
    "name": "Sadid Ahmed",
    "is_approved": true
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `401` | Invalid credentials |
| `403` | Account suspended |
| `403` | Email not verified |

---

### POST `/auth/logout` `[Auth]`

Revokes the current Bearer token.

**Response `200`**

```json
{ "message": "Logged out successfully." }
```

---

### GET `/auth/me` `[Auth]`

Returns the authenticated user's account and profile data.

**Response `200`**

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "student",
  "name": "Sadid Ahmed",
  "is_approved": true,
  "email_verified_at": "2025-01-01T00:00:00Z",
  "student": { ... },
  "institution": null,
  "verifier": null
}
```

---

### POST `/auth/forgot-password`

Sends a password reset link to the given email.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `email` * | string | email, exists in users table |

**Response `200`**

```json
{ "message": "Password reset link sent successfully." }
```

_(In `local` environment, response also includes `token`.)_

---

### POST `/auth/reset-password`

Resets password using the token received by email.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `token` * | string | — |
| `email` * | string | email, exists in users table |
| `password` * | string | min:8, confirmed |
| `password_confirmation` * | string | — |

**Response `200`**

```json
{ "message": "Password has been reset successfully." }
```

---

### POST `/auth/verify-email`

Verifies a user's email address using the 6-digit OTP sent on registration.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `email` * | string | email |
| `code` * | string | — |

**Response `200`**

```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

---

### POST `/auth/resend-verification`

Resends the email verification OTP.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `email` * | string | email |

**Response `200`**

```json
{ "success": true, "message": "Verification code resent." }
```

---

### POST `/auth/verify-email-change` `[Auth]`

Verifies a pending email address change via a 6-digit OTP sent to the new email.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `code` * | string | — |

**Response `200`**

```json
{
  "success": true,
  "message": "Email address updated successfully."
}
```

---

## 2. Shared — Profile & Settings

### GET `/profile` `[Auth]`

Returns the authenticated user's profile including role-specific data.

**Response `200`**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student",
    "name": "Sadid Ahmed",
    "is_approved": true,
    "student": { ... },
    "institution": null,
    "verifier": null
  }
}
```

---

### PUT `/profile` `[Auth]`

Updates mutable, non-sensitive profile fields. Sensitive fields (email, name, NID, etc.) require a Profile Change Request.

**Request Body** _(role-dependent; all fields optional)_

For **student**: `phone`, `address`  
For **university**: `address`, `city`, `phone`, `website`  
For **verifier**: `contact_person`, `designation`, `phone`, `address`, `website`

**Response `200`**

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": { ... }
}
```

---

### PUT `/profile/password` `[Auth]`

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `current_password` * | string | — |
| `password` * | string | min:8, confirmed |
| `password_confirmation` * | string | — |

**Response `200`**

```json
{ "success": true, "message": "Password updated successfully." }
```

---

### DELETE `/profile/email-change` `[Auth]`

Cancels a pending email change request and clears the pending new email.

**Response `200`**

```json
{ "success": true, "message": "Email change cancelled." }
```

---

### GET `/profile/activity` `[Auth]`

Returns the authenticated user's recent activity log entries (paginated, 20 per page).

**Response `200`**

```json
{
  "success": true,
  "activities": {
    "data": [
      {
        "id": 1,
        "action": "STUDENT_ENROLLED",
        "description": "...",
        "ip_address": "127.0.0.1",
        "created_at": "2025-01-01 12:00:00"
      }
    ],
    "current_page": 1,
    "last_page": 1,
    "total": 1
  }
}
```

---

### GET `/settings` `[Auth]`

Returns the authenticated user's preference settings.

**Response `200`**

```json
{
  "success": true,
  "settings": {
    "email_notifications": true,
    "profile_visibility": "verifiers_only",
    "show_email_to_verifiers": false,
    "show_institution_to_public": true,
    "allow_verifier_search": true,
    "certificate_preferences": { "default_visibility": "private" }
  }
}
```

---

### PUT `/settings` `[Auth]`

Updates user preference settings.

**Request Body** _(all fields optional)_

| Field | Type | Rules |
|-------|------|-------|
| `email_notifications` | boolean | _(Optional)_ |
| `profile_visibility` | string | _(Optional)_, `public`, `verifiers_only`, `private` |
| `show_email_to_verifiers` | boolean | _(Optional)_ |
| `show_institution_to_public` | boolean | _(Optional)_ |
| `allow_verifier_search` | boolean | _(Optional)_ |
| `certificate_preferences` | object | _(Optional)_ |
| `certificate_preferences.default_visibility` | string | _(Optional)_, `public`, `private` |

**Response `200`**

```json
{
  "success": true,
  "message": "Settings updated successfully.",
  "settings": { ... }
}
```

---

### POST `/settings/reset` `[Auth]`

Resets all settings to defaults.

**Response `200`**

```json
{
  "success": true,
  "message": "Settings reset to defaults.",
  "settings": { ... }
}
```

---

## 3. Shared — Notifications

### GET `/notifications` `[Auth]`

Returns the 20 most recent unread notifications.

**Response `200`**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "ENROLLMENT",
      "title": "You have been enrolled",
      "message": "You have been enrolled in ...",
      "link": "/student/dashboard",
      "read_at": null,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ],
  "unread_count": 3
}
```

---

### GET `/notifications/all` `[Auth]`

Returns all notifications (paginated).

**Response `200`** — same structure as `/notifications`, paginated.

---

### GET `/notifications/unread-count` `[Auth]`

**Response `200`**

```json
{ "success": true, "unread_count": 5 }
```

---

### POST `/notifications/read-all` `[Auth]`

Marks all notifications as read.

**Response `200`**

```json
{ "success": true, "message": "All notifications marked as read." }
```

---

### POST `/notifications/{id}/read` `[Auth]`

Marks a single notification as read.

**Response `200`**

```json
{ "success": true }
```

---

## 4. Shared — Profile Change Requests

### GET `/profile/change-requests` `[Auth]`

Returns the authenticated user's own profile change requests (paginated, 15 per page).

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "field_name": "first_name",
      "field_label": "First Name",
      "current_value": "Jane",
      "requested_value": "Janet",
      "reason": "Legal name change",
      "has_documents": true,
      "document_count": 1,
      "status": "pending",
      "review_notes": null,
      "reviewer_email": null,
      "created_at": "2025-01-01 12:00:00",
      "updated_at": "2025-01-01 12:00:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

---

### POST `/profile/change-requests` `[Auth]`

Submits a new profile field change request. Sensitive fields require supporting documents (PDF/JPG/PNG, max 5 MB each, max 3 files).

**Approvable fields by role:**

| Role | Fields |
|------|--------|
| Student | `email`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `nid` |
| University | `email`, `name`, `registration_number` |
| Verifier | `email`, `company_name`, `website` |

**Fields requiring supporting documents:** `first_name`, `middle_name`, `last_name`, `date_of_birth`, `nid`, `name`, `registration_number`, `company_name`

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| `field_name` * | string | one of approvable fields for role |
| `requested_value` * | string | max:500 |
| `reason` * | string | min:10, max:1000 |
| `supporting_documents` | file[] | _(Optional)_, pdf/jpg/jpeg/png, max 5120 KB each, max 3 files |

**Response `201`**

```json
{
  "success": true,
  "message": "Your change request has been submitted for admin review.",
  "request": { ... }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `409` | Pending request for same field already exists |
| `422` | Documents required but not provided |

---

### DELETE `/profile/change-requests/{id}` `[Auth]`

Cancels a pending profile change request. Deletes associated uploaded documents.

**Response `200`**

```json
{ "success": true, "message": "Change request cancelled successfully." }
```

---

## 5. Shared — Certificates

### GET `/certificates/{id}/pdf` `[Auth]`

Downloads a certificate as a PDF. The certificate must belong to the authenticated user (student) or their institution (university).

**Response** — PDF file stream.

---

### GET `/certificates/search` `[Auth]`

Searches certificates by serial number.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `serial` * | string | Serial number to search for |

**Response `200`**

```json
{
  "success": true,
  "certificates": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "student_name": "Sadid Ahmed",
      "institution": "Example University",
      "certificate_name": "Bachelor of Science",
      "issue_date": "2025-05-15",
      "revoked_at": null
    }
  ]
}
```

---

### POST `/university/certificates/{id}/revoke` `[Auth]` `[Role: university]`  
### POST `/admin/certificates/{id}/revoke` `[Auth]` `[Role: admin]`

Revokes a certificate. University can only revoke certificates belonging to their institution. Admin can revoke any certificate.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `reason` * | string | min:10, max:1000 |

**Response `200`**

```json
{
  "success": true,
  "message": "Certificate revoked successfully.",
  "certificate": {
    "id": 1,
    "serial": "BSC-25-000001A",
    "revoked_at": "2025-06-01T00:00:00Z",
    "revoked_by_role": "university",
    "revocation_reason": "Fraudulent submission",
    "revocation_history": [ ... ]
  }
}
```

---

## 6. Public Endpoints

### POST `/verify/certificate`

Verifies a certificate by serial number and student date of birth. Works for unauthenticated users. Authenticated verifiers have their attempt logged.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `serial` * | string | max:100 |
| `date_of_birth` * | string | date, format `YYYY-MM-DD` |

**Response `200` — Valid Certificate**

```json
{
  "success": true,
  "verified": true,
  "message": "Certificate verified successfully",
  "certificate": {
    "serial": "BSC-25-000001A",
    "student_name": "Sadid Ahmed",
    "student_id": "ENR-25-000001",
    "certificate_level": "Bachelor of Science",
    "program": "Computer Science",
    "major": "Software Engineering",
    "registration_no": "ENR-25-000001",
    "cgpa": "3.75",
    "issue_date": "2025-05-15",
    "completion_date": "2025-06-20",
    "institution": "Example University",
    "issued_by": "Prof. Dr. Sayem Prodhan",
    "status": "valid",
    "is_public": true
  }
}
```

**Response `200` — Revoked Certificate**

```json
{
  "success": true,
  "verified": false,
  "status": "revoked",
  "message": "This certificate has been revoked.",
  "revoked_at": "2025-06-01",
  "revocation_reason": "...",
  "revoked_by": "Administrator"
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Invalid serial number format (checksum failed) |
| `401` | Date of birth does not match records |
| `403` | Certificate is private |
| `404` | Certificate not found |

---

### GET `/verify-link`

Verifies a certificate from an encrypted share link. Decrypts the DOB token embedded in the link and delegates to the verify logic.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `s` * | string | Certificate serial number |
| `v` * | string | Encrypted DOB token |

**Response** — Same structure as `POST /verify/certificate`.

---

### GET `/verify/system-stats`

Returns aggregate platform statistics for the public landing page.

**Response `200`**

```json
{
  "success": true,
  "totalSystemUsers": 1500,
  "totalUniversities": 25,
  "totalCertificates": 8000
}
```

---

### GET `/public/universities`

Lists approved institutions with optional search.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | _(Optional)_, filter by institution name |

**Response `200`** (paginated, 20 per page)

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Example University",
        "city": "Dhaka",
        "website": "https://example.edu",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "current_page": 1,
    "last_page": 1,
    "total": 1
  }
}
```

---

### GET `/public/health`

System health check.

**Response `200`**

```json
{
  "success": true,
  "status": "operational",
  "database": "operational",
  "api": "operational"
}
```

**Response `503`** — if database is offline.

---

## 7. Student

All routes under `/student/*` require `[Auth]` and `[Role: student]`.

---

### GET `/student/dashboard`

Returns the student's dashboard statistics and recent activity.

**Response `200`**

```json
{
  "success": true,
  "student": { ... },
  "stats": {
    "total_certificates": 2,
    "public_certificates": 1,
    "private_certificates": 1,
    "active_enrollments": 1
  },
  "recent_certificates": [ ... ],
  "recent_activity": [ ... ]
}
```

---

### GET `/student/certificates`

Lists all certificates belonging to the authenticated student.

**Response `200`**

```json
{
  "success": true,
  "certificates": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "certificate_name": "Bachelor of Science",
      "department": "Computer Science",
      "major": "Software Engineering",
      "session": "Spring 2025",
      "cgpa": "3.75",
      "issue_date": "2025-05-15",
      "is_publicly_shareable": true,
      "revoked_at": null,
      "institution": "Example University",
      "share_link": "https://..."
    }
  ]
}
```

---

### GET `/student/certificates/{id}`

Returns full details of a single certificate belonging to the student.

**Response `200`**

```json
{
  "success": true,
  "certificate": {
    "id": 1,
    "serial": "BSC-25-000001A",
    "certificate_name": "Bachelor of Science",
    "department": "Computer Science",
    "major": "Software Engineering",
    "session": "Spring 2025",
    "cgpa": "3.75",
    "degree_class": "First Class",
    "issue_date": "2025-05-15",
    "convocation_date": "2025-06-20",
    "authority_name": "Prof. Dr. Sayem Prodhan",
    "authority_title": "Vice Chancellor",
    "is_publicly_shareable": true,
    "revoked_at": null,
    "revocation_reason": null,
    "institution": "Example University",
    "share_link": "https://..."
  }
}
```

---

### POST `/student/certificates/{id}/toggle-visibility`

Toggles a certificate between public and private visibility.

**Response `200`**

```json
{
  "success": true,
  "message": "Certificate is now public.",
  "is_publicly_shareable": true
}
```

---

### GET `/student/access-requests`

Lists all pending certificate access requests from verifiers directed at the student.

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "verifier_id": 3,
      "company_name": "Acme Corp",
      "purpose": "Employment background check",
      "status": "pending",
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### POST `/student/access-requests/{id}/approve`

Approves a verifier's certificate access request. Creates a `VerifierAccess` record with an expiry date.

**Response `200`**

```json
{ "success": true, "message": "Access request approved." }
```

---

### POST `/student/access-requests/{id}/reject`

Rejects a verifier's certificate access request.

**Response `200`**

```json
{ "success": true, "message": "Access request rejected." }
```

---

### GET `/student/granted-access`

Lists all active verifier access grants the student has approved.

**Response `200`**

```json
{
  "success": true,
  "accesses": [
    {
      "id": 1,
      "verifier_id": 3,
      "company_name": "Acme Corp",
      "granted_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-07-01T00:00:00Z",
      "revoked_at": null,
      "is_active": true
    }
  ]
}
```

---

### POST `/student/granted-access/{id}/revoke`

Revokes an active verifier access grant.

**Response `200`**

```json
{ "success": true, "message": "Access revoked." }
```

---

### POST `/student/withdrawal/request`

Submits a withdrawal request from the student's current active enrollment.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `reason` * | string | min:20, max:1000 |

**Response `201`**

```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully.",
  "withdrawal_request": { ... }
}
```

---

### GET `/student/withdrawal/requests`

Lists the student's withdrawal requests.

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "enrollment_id": 5,
      "reason": "Personal reasons",
      "status": "pending",
      "response_message": null,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### GET `/student/extension-requests`

Lists the student's graduation date extension requests.

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "enrollment_id": 5,
      "requested_graduation_date": "2026-12-31",
      "reason": "Research completion delay",
      "status": "pending",
      "university_response": null,
      "counter_offered_date": null,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### POST `/student/extension-requests`

Submits a graduation date extension request. A supporting document may be uploaded.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| `enrollment_id` * | integer | exists in enrollments |
| `requested_graduation_date` * | string | date, after:today |
| `reason` * | string | min:20, max:1000 |
| `supporting_document` | file | _(Optional)_, pdf/jpg/jpeg/png, max 5120 KB |

**Response `201`**

```json
{
  "success": true,
  "message": "Extension request submitted.",
  "request": { ... }
}
```

---

### DELETE `/student/extension-requests/{id}`

Cancels a pending extension request.

**Response `200`**

```json
{ "success": true, "message": "Extension request cancelled." }
```

---

### POST `/student/extension-requests/{id}/accept`

Accepts a university counter-offer on a graduation date extension request.

**Response `200`**

```json
{ "success": true, "message": "Counter offer accepted." }
```

---

### POST `/student/extension-requests/{id}/decline`

Declines a university counter-offer on a graduation date extension request.

**Response `200`**

```json
{ "success": true, "message": "Counter offer declined." }
```

---

### GET `/student/universities`

Lists all approved institutions the student can apply to.

**Response `200`**

```json
{
  "success": true,
  "institutions": [
    {
      "id": 1,
      "name": "Example University",
      "city": "Dhaka",
      "website": "https://example.edu"
    }
  ]
}
```

---

### GET `/student/universities/{id}/programs`

Lists active certificate levels and departments for a specific institution.

**Response `200`**

```json
{
  "success": true,
  "certificate_levels": [
    { "id": 1, "name": "Bachelor of Science", "short_code": "BSc" }
  ],
  "departments": [
    { "id": 1, "name": "Computer Science", "certificate_level_id": 1 }
  ]
}
```

---

### GET `/student/enrollment-applications`

Lists the student's enrollment applications.

**Response `200`**

```json
{
  "success": true,
  "applications": [
    {
      "id": 1,
      "institution_id": 1,
      "institution_name": "Example University",
      "certificate_level_id": 1,
      "certificate_level_name": "Bachelor of Science",
      "department_id": 2,
      "department_name": "Computer Science",
      "batch": "2025",
      "reason": "Seeking higher education",
      "status": "pending",
      "university_response": null,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### POST `/student/enrollment-applications`

Submits an enrollment application to a university.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| `institution_id` * | integer | exists in institutions |
| `certificate_level_id` * | integer | exists in certificate_levels |
| `department_id` * | integer | exists in departments |
| `major_id` | integer | _(Optional)_, exists in majors |
| `batch` * | string | max:100 |
| `reason` | string | _(Optional)_, max:1000 |
| `document` | file | _(Optional)_, pdf/jpg/jpeg/png, max 5120 KB |

**Response `201`**

```json
{
  "success": true,
  "message": "Enrollment application submitted.",
  "application": { ... }
}
```

---

### DELETE `/student/enrollment-applications/{id}`

Cancels a pending enrollment application.

**Response `200`**

```json
{ "success": true, "message": "Application cancelled." }
```

---

### GET `/student/program-change-requests`

Lists the student's program change requests.

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "institution_name": "Example University",
      "requested_department": "Mathematics",
      "requested_major": null,
      "reason": "Change of academic interest",
      "status": "pending",
      "admin_note": null,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### POST `/student/program-change-requests`

Submits a program change request for an active enrollment. Only one pending request per enrollment is allowed.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `enrollment_id` * | integer | exists in enrollments |
| `requested_department_id` * | integer | exists in departments |
| `requested_major_id` | integer | _(Optional)_, exists in majors |
| `reason` * | string | max:1000 |

**Response `201`**

```json
{
  "success": true,
  "message": "Program change request submitted successfully.",
  "request": { ... }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `400` | Enrollment is not active |
| `400` | Pending program change request already exists for this enrollment |

---

### DELETE `/student/program-change-requests/{id}`

Cancels a pending program change request (sets status to `cancelled`).

**Response `200`**

```json
{ "success": true, "message": "Program change request cancelled" }
```

---

## 8. University

All routes under `/university/*` require `[Auth]` and `[Role: university]`.

---

### GET `/university/dashboard`

Returns institution statistics and recent activity. Results are cached for 60 seconds.

**Response `200`**

```json
{
  "institution": { ... },
  "stats": {
    "total_certificates": 500,
    "active_certificates": 480,
    "revoked_certificates": 20,
    "pending_withdrawals": 3,
    "pending_enrollment_applications": 5,
    "total_enrolled": 300,
    "graduated_students": 150,
    "this_month_certificates": 10,
    "active_programs": 8
  },
  "recent_certificates": [ ... ],
  "recent_enrollments": [
    {
      "id": 1,
      "student_name": "Sadid Ahmed",
      "program": "BSc — Computer Science",
      "enrollment_date": "2025-01-01",
      "status": "active"
    }
  ]
}
```

---

### PUT `/university/settings/authority`

Updates the institution's default certificate authority name and title.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `default_authority_name` | string | _(Optional)_, max:255 |
| `default_authority_title` | string | _(Optional)_, max:255 |

**Response `200`**

```json
{
  "success": true,
  "message": "Authority defaults updated successfully",
  "institution": {
    "default_authority_name": "Prof. Dr. Sayem Prodhan",
    "default_authority_title": "Vice Chancellor"
  }
}
```

---

### GET `/university/certificate-levels`

Lists all certificate levels for the institution, with active student count.

**Response `200`**

```json
{
  "success": true,
  "certificate_levels": [
    {
      "id": 1,
      "name": "Bachelor of Science",
      "short_code": "BSc",
      "is_active": true,
      "student_count": 150
    }
  ]
}
```

---

### POST `/university/certificate-levels`

Creates a new certificate level. Name must be unique within the institution.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `name` * | string | max:255, unique per institution |
| `short_code` * | string | max:20 |

**Response `201`**

```json
{
  "success": true,
  "message": "Certificate level created successfully",
  "certificate_level": { ... }
}
```

---

### PUT `/university/certificate-levels/{id}`

Updates a certificate level.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `name` * | string | max:255, unique per institution (excluding self) |
| `short_code` * | string | max:20 |
| `is_active` | boolean | _(Optional)_ |

**Response `200`**

```json
{
  "success": true,
  "message": "Certificate level updated successfully",
  "certificate_level": { ... }
}
```

---

### DELETE `/university/certificate-levels/{id}`

Soft-deactivates a certificate level (`is_active = false`).

**Response `200`**

```json
{
  "success": true,
  "message": "Certificate level deactivated successfully",
  "certificate_level": { ... }
}
```

---

### POST `/university/certificate-levels/{id}/reactivate`

Reactivates a previously deactivated certificate level.

**Response `200`**

```json
{
  "success": true,
  "message": "Certificate level reactivated successfully",
  "certificate_level": { ... }
}
```

---

### GET `/university/departments`

Lists all departments for the institution with active student count.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `certificate_level_id` | integer | _(Optional)_, filter by certificate level |

**Response `200`**

```json
{
  "success": true,
  "departments": [
    {
      "id": 1,
      "name": "Computer Science",
      "short_code": "CS",
      "certificate_level_id": 1,
      "is_active": true,
      "student_count": 80
    }
  ]
}
```

---

### POST `/university/departments`

Creates a new department. Name must be unique within the institution.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `name` * | string | max:255, unique per institution |
| `short_code` | string | _(Optional)_, max:50 |
| `certificate_level_id` | integer | _(Optional)_, exists in certificate_levels |

**Response `201`**

```json
{
  "success": true,
  "message": "Department created successfully",
  "department": { ... }
}
```

---

### PUT `/university/departments/{id}`

Updates a department.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `name` * | string | max:255, unique per institution (excluding self) |
| `short_code` | string | _(Optional)_, max:50 |
| `is_active` | boolean | _(Optional)_ |
| `certificate_level_id` | integer | _(Optional)_, exists in certificate_levels |

**Response `200`**

```json
{
  "success": true,
  "message": "Department updated successfully",
  "department": { ... }
}
```

---

### DELETE `/university/departments/{id}`

Soft-deactivates a department (`is_active = false`).

**Response `200`**

```json
{
  "success": true,
  "message": "Department deactivated successfully",
  "department": { ... }
}
```

---

### POST `/university/departments/{id}/reactivate`

Reactivates a deactivated department.

**Response `200`**

```json
{
  "success": true,
  "message": "Department reactivated successfully",
  "department": { ... }
}
```

---

### GET `/university/majors`

Lists all majors for the institution.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `department_id` | integer | _(Optional)_, filter by department |

**Response `200`**

```json
{
  "success": true,
  "majors": [
    { "id": 1, "name": "Software Engineering", "department_id": 1, "is_active": true }
  ]
}
```

---

### POST `/university/majors`

Creates a new major within a department. Name must be unique within the department.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `department_id` * | integer | exists in departments (must belong to institution) |
| `name` * | string | max:255, unique per department |

**Response `201`**

```json
{
  "success": true,
  "message": "Major created successfully",
  "major": { ... }
}
```

---

### PUT `/university/majors/{id}`

Updates a major.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `name` * | string | max:255, unique per department (excluding self) |
| `is_active` | boolean | _(Optional)_ |

**Response `200`**

```json
{
  "success": true,
  "message": "Major updated successfully",
  "major": { ... }
}
```

---

### DELETE `/university/majors/{id}`

Soft-deactivates a major (`is_active = false`).

**Response `200`**

```json
{
  "success": true,
  "message": "Major deactivated successfully",
  "major": { ... }
}
```

---

### POST `/university/majors/{id}/reactivate`

Reactivates a deactivated major.

**Response `200`**

```json
{
  "success": true,
  "message": "Major reactivated successfully",
  "major": { ... }
}
```

---

### GET `/university/enrollments`

Lists all enrollments for the institution (paginated, 15 per page).

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | _(Optional)_, `all` (default), `active`, `graduated`, `suspended`, `withdrawn` |
| `search` | string | _(Optional)_, search by student name, enrollment number, or roll number |
| `certificate_level_id` | integer | _(Optional)_ |
| `department_id` | integer | _(Optional)_ |

**Response `200`**

```json
{
  "success": true,
  "enrollments": [
    {
      "id": 1,
      "enrollment_number": "EXA-25-000001",
      "student_name": "Sadid Ahmed",
      "student_id": "CS-001",
      "roll_number": "CS-001",
      "student_email": "jane@example.com",
      "db_student_id": 5,
      "program": "BSc — Computer Science",
      "certificate_level_id": 1,
      "certificate_level_name": "Bachelor of Science",
      "department_id": 2,
      "department_name": "Computer Science",
      "major_id": null,
      "major_name": null,
      "batch": "2025",
      "status": "active",
      "enrollment_date": "2025-01-01",
      "expected_graduation": "2029-01-01",
      "actual_graduation": null,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "stats": {
    "total": 300,
    "active": 250,
    "graduated": 50
  },
  "pagination": {
    "current_page": 1,
    "last_page": 20,
    "per_page": 15,
    "total": 300
  }
}
```

---

### GET `/university/enrollments/programs`

Lists programs (aggregated from enrollments) with student counts by status.

**Response `200`**

```json
{
  "success": true,
  "programs": [
    {
      "name": "BSc — Computer Science",
      "active_count": 80,
      "graduated_count": 20,
      "withdrawn_count": 5,
      "recent_enrollment_date": "2025-01-01",
      "students": [
        {
          "id": 1,
          "student_name": "Sadid Ahmed",
          "roll_number": "CS-001",
          "batch": "2025",
          "enrollment_date": "2025-01-01",
          "status": "active"
        }
      ]
    }
  ]
}
```

---

### POST `/university/enrollments`

Directly enrolls a student. Validates for active enrollment conflicts globally.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `student_email` * | string | email, exists in users |
| `department_id` * | integer | exists in departments (must be active, belong to institution) |
| `certificate_level_id` * | integer | exists in certificate_levels (must be active, belong to institution) |
| `major_id` | integer | _(Optional)_, exists in majors (must belong to department) |
| `program` | string | _(Optional)_, max:255 (overridden by cert level + department name) |
| `program_level` | string | _(Optional)_, max:255 |
| `batch` * | string | max:100 |
| `roll_number` | string | _(Optional)_, max:100, unique per institution |
| `enrollment_date` * | string | date |
| `expected_graduation_date` | string | _(Optional)_, date, after:enrollment_date |

**Response `201`**

```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "enrollment": {
    "id": 1,
    "enrollment_number": "EXA-25-000001",
    "student_name": "Sadid Ahmed",
    "program": "BSc — Computer Science",
    "batch": "2025",
    "status": "active"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `404` | Student not found or not approved |
| `409` | Student already has an active enrollment at another university |
| `409` | Student has a suspended enrollment at this university |

---

### PATCH `/university/enrollments/{id}`

Updates enrollment program details. Cannot edit graduated or withdrawn enrollments.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `department_id` * | integer | exists in departments |
| `certificate_level_id` * | integer | exists in certificate_levels |
| `major_id` | integer | _(Optional)_, exists in majors |
| `batch` | string | _(Optional)_, max:100 |

**Response `200`**

```json
{
  "success": true,
  "message": "Enrollment updated successfully",
  "enrollment": {
    "id": 1,
    "program": "BSc — Computer Science",
    "certificate_level_id": 1,
    "certificate_level_name": "Bachelor of Science",
    "department_id": 2,
    "department_name": "Computer Science",
    "major_id": null,
    "major_name": null,
    "batch": "2025"
  }
}
```

---

### PATCH `/university/enrollments/{id}/status`

Updates enrollment status with valid transition enforcement.

**Valid transitions:**

| From | Allowed To |
|------|-----------|
| `active` | `active`, `graduated`, `suspended`, `withdrawn` |
| `suspended` | `suspended`, `active`, `withdrawn` |
| `withdrawal_requested` | `withdrawn`, `active` |
| `graduated` / `withdrawn` | _(terminal — no transitions allowed)_ |

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `status` * | string | `active`, `graduated`, `suspended`, `withdrawn`, `withdrawal_requested` |
| `actual_graduation_date` | string | _(Optional)_, date |
| `suspension_reason` | string | required if `status` is `suspended`, min:10, max:1000 |

**Response `200`**

```json
{
  "success": true,
  "message": "Enrollment status updated successfully",
  "enrollment": {
    "id": 1,
    "status": "graduated",
    "suspension_reason": null,
    "actual_graduation_date": "2025-05-15"
  }
}
```

When `status` is `graduated`, response additionally includes:

```json
{
  "redirect_to_certificate_issuance": true,
  "student_data": {
    "id": 5,
    "name": "Sadid Ahmed",
    "enrollment_id": 1,
    "program": "BSc — Computer Science",
    "batch": "2025"
  }
}
```

---

### PATCH `/university/enrollments/{id}/extend-graduation`

Directly extends the expected graduation date for an enrollment.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `new_expected_graduation_date` * | string | date, must be after current expected date and after enrollment date |
| `reason` * | string | min:10, max:500 |

**Response `200`**

```json
{
  "success": true,
  "message": "Graduation date extended by 6 months",
  "enrollment": {
    "id": 1,
    "old_expected_graduation": "2028-01-01",
    "new_expected_graduation": "2028-07-01",
    "extension_period": "6 months"
  }
}
```

---

### GET `/university/students/search`

Searches students eligible for enrollment at this institution.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` / `q` * | string | min 2 characters; searches NID hash, name, email, roll number |
| `enrolled` | boolean | _(Optional)_, if `true`, only return students already enrolled here |

**Response `200`**

```json
{
  "success": true,
  "students": [
    {
      "id": 5,
      "name": "Sadid Ahmed",
      "email": "jane@example.com",
      "is_enrolled_here": false,
      "is_enrolled_anywhere": false,
      "active_institution": null
    }
  ]
}
```

---

### GET `/university/students/{id}`

Returns full profile of a student enrolled at this institution (NID is not returned).

**Response `200`**

```json
{
  "success": true,
  "student": {
    "id": 5,
    "name": "Sadid Ahmed",
    "email": "jane@example.com",
    "phone": "01700000000",
    "gender": "Female",
    "date_of_birth": "01/01/2000",
    "address": "Dhaka, Bangladesh",
    "enrollments": [
      {
        "institution": "Example University",
        "program": "BSc — Computer Science",
        "batch": "2025",
        "status": "active",
        "enrollment_date": "01/01/2025"
      }
    ]
  }
}
```

---

### GET `/university/certificates`

Lists all certificates issued by the institution.

**Response `200`**

```json
{
  "success": true,
  "certificates": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "student_name": "Sadid Ahmed",
      "issued_name": "Sadid Ahmed",
      "certificate_name": "Bachelor of Science",
      "issue_date": "2025-05-15",
      "revoked_at": null,
      "revoked_by_role": null,
      "revocation_reason": null
    }
  ]
}
```

---

### POST `/university/certificates`

Issues a new certificate to an enrolled (active or graduated) student. Automatically marks the enrollment as `graduated` if still active.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `student_id` * | integer | exists in students |
| `certificate_level_id` * | integer | exists in certificate_levels |
| `department_id` * | integer | exists in departments |
| `major_id` | integer | _(Optional)_, exists in majors |
| `session` * | string | max:255 |
| `issue_date` * | string | date, format `DD/MM/YYYY` |
| `convocation_date` | string | _(Optional)_, date, format `DD/MM/YYYY` |
| `authority_name` * | string | max:255 |
| `authority_title` * | string | max:255 |
| `cgpa` | number | _(Optional)_, min:0, max:4 |
| `degree_class` | string | _(Optional)_, max:100 |

**Response `201`**

```json
{
  "success": true,
  "message": "Certificate issued successfully",
  "certificate": {
    "id": 1,
    "serial": "BSC-25-000001A",
    "certificate_name": "Bachelor of Science",
    "issue_date": "2025-05-15"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `403` | Student is not enrolled (active/graduated) at this institution |
| `409` | Certificate with same level and session already exists for this student |
| `422` | Certificate level has no `short_code` set |

---

### GET `/university/certificates/prefill/{studentId}`

Returns pre-fill data for the certificate issuance form for a specific student.

**Response `200`**

```json
{
  "success": true,
  "prefill": {
    "student_name": "Sadid Ahmed",
    "student_email": "jane@example.com",
    "roll_number": "CS-001",
    "department_id": 2,
    "department_name": "Computer Science",
    "major_id": null,
    "major_name": null,
    "certificate_level_id": 1,
    "certificate_level_name": "Bachelor of Science",
    "academic_session": "2025",
    "cgpa": null,
    "degree_class": null,
    "default_authority_name": "Prof. Dr. Sayem Prodhan",
    "default_authority_title": "Vice Chancellor",
    "certificate_levels": [
      { "id": 1, "name": "Bachelor of Science", "short_code": "BSc" }
    ]
  }
}
```

---

### GET `/university/certificates/{id}`

Returns full details of a single certificate issued by this institution.

**Response `200`**

```json
{
  "success": true,
  "certificate": {
    "id": 1,
    "serial": "BSC-25-000001A",
    "student_name": "Sadid Ahmed",
    "issued_name": "Sadid Ahmed",
    "roll_number": "CS-001",
    "certificate_name": "Bachelor of Science",
    "department": "Computer Science",
    "major": null,
    "session": "Spring 2025",
    "cgpa": "3.75",
    "degree_class": "First Class",
    "issue_date": "2025-05-15",
    "convocation_date": "2025-06-20",
    "authority_name": "Prof. Dr. Sayem Prodhan",
    "authority_title": "Vice Chancellor",
    "revoked_at": null,
    "revoked_by_role": null,
    "revocation_reason": null,
    "revocation_history": [],
    "revoked_by_name": null,
    "qr_code_url": "https://..."
  }
}
```

---

### GET `/university/certificates/{id}/download`

Downloads a certificate PDF.

**Response** — PDF file stream.

---

### POST `/university/certificates/{id}/unrevoke`

Restores a certificate that was revoked by the university (not applicable if revoked by admin).

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `reason` * | string | min:10, max:1000 |

**Response `200`**

```json
{
  "success": true,
  "message": "Certificate successfully restored.",
  "certificate": {
    "id": 1,
    "serial": "BSC-25-000001A",
    "revoked_at": null,
    "revoked_by_role": null,
    "revocation_reason": null,
    "revocation_history": [ ... ]
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `403` | Certificate was revoked by admin — university cannot restore it |
| `422` | Certificate is not currently revoked |

---

### POST `/university/certificates/batch`

Issues multiple certificates by uploading a CSV file. Processes row by row inside a single transaction.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| `csv_file` * | file | csv/txt, max 2048 KB |

**CSV Columns:** `student_email`, `certificate_level_short_code`, `department_name`, `major_name` _(Optional)_, `session`, `cgpa` _(Optional)_, `degree_class` _(Optional)_, `issue_date` (DD/MM/YYYY), `convocation_date` _(Optional)_, `authority_name`, `authority_title`

**Response `200`**

```json
{
  "success": true,
  "message": "Processed 10 certificates, 2 failed",
  "results": {
    "processed": 10,
    "failed": 2,
    "errors": [
      { "row": 3, "student_email": "bad@example.com", "error": "Student not enrolled in your institution" }
    ],
    "certificates": [
      { "serial": "BSC-25-000001A", "student_name": "Sadid Ahmed", "student_email": "jane@example.com" }
    ]
  }
}
```

---

### GET `/university/certificates/batch-template`

Downloads a sample CSV template for batch certificate issuance.

**Response** — CSV file download.

---

### GET `/university/withdrawal/pending`

Lists pending withdrawal requests for this institution (paginated, 10 per page).

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | _(Optional)_, search by student name, ID, or enrollment number |

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "enrollment_id": 5,
      "student_name": "Sadid Ahmed",
      "student_email": "jane@example.com",
      "enrollment_number": "EXA-25-000001",
      "program": "BSc — Computer Science",
      "batch": "2025",
      "requested_by": "student",
      "reason": "Personal reasons",
      "requested_at": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "total": 1,
    "per_page": 10
  }
}
```

---

### POST `/university/withdrawal/{id}/approve`

Approves a pending student withdrawal request. Sets enrollment status to `withdrawn`.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `response_message` | string | _(Optional)_, max:500 |

**Response `200`**

```json
{ "success": true, "message": "Withdrawal request approved. Student has been withdrawn." }
```

---

### POST `/university/withdrawal/{id}/reject`

Rejects a pending withdrawal request. Reverts enrollment status back to `active`.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `response_message` * | string | min:10, max:500 |

**Response `200`**

```json
{ "success": true, "message": "Withdrawal request rejected. Enrollment remains active." }
```

---

### POST `/university/enrollments/{id}/withdraw`

University directly withdraws a student from an active or suspended enrollment without requiring a student request.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `reason` * | string | min:20, max:1000 |

**Response `200`**

```json
{ "success": true, "message": "Student withdrawn successfully" }
```

---

### GET `/university/extension-requests`

Lists all extension requests for this institution's enrollments (paginated, 10 per page), ordered by status priority (pending first).

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "enrollment_id": 5,
      "student_name": "Sadid Ahmed",
      "student_email": "jane@example.com",
      "program": "BSc — Computer Science",
      "batch": "2025",
      "current_expected_graduation": "2029-01-01",
      "requested_graduation_date": "2029-07-01",
      "reason": "Research delay",
      "supporting_document_path": null,
      "status": "pending",
      "university_response": null,
      "counter_offered_date": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### POST `/university/extension-requests/{id}/approve`

Approves a pending extension request. Updates enrollment's `expected_graduation_date` atomically.

**Response `200`**

```json
{ "success": true, "message": "Extension request approved successfully" }
```

---

### POST `/university/extension-requests/{id}/reject`

Rejects a pending extension request with a required reason.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `university_response` * | string | min:10, max:1000 |

**Response `200`**

```json
{ "success": true, "message": "Extension request rejected" }
```

---

### POST `/university/extension-requests/{id}/counter-offer`

Sends a counter-offer with an alternative graduation date. Counter-offered date must be after the current expected graduation date.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `counter_offered_date` * | string | date, after:today |
| `university_response` * | string | min:10, max:1000 |

**Response `200`**

```json
{ "success": true, "message": "Counter offer sent to student" }
```

---

### GET `/university/program-change-requests`

Lists all program change requests for this institution, ordered by creation date.

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "student_name": "Sadid Ahmed",
      "roll_number": "CS-001",
      "current_department": "Computer Science",
      "current_major": null,
      "requested_department": "Mathematics",
      "requested_major": null,
      "reason": "Change of interest",
      "status": "pending",
      "admin_note": null,
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### POST `/university/program-change-requests/{id}/approve`

Approves a pending program change request and updates the enrollment's department and major.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `admin_note` | string | _(Optional)_ |

**Response `200`**

```json
{ "success": true, "message": "Program change request approved successfully" }
```

---

### POST `/university/program-change-requests/{id}/reject`

Rejects a pending program change request with a required note.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `admin_note` * | string | max:1000 |

**Response `200`**

```json
{ "success": true, "message": "Program change request rejected" }
```

---

### GET `/university/enrollment-applications`

Lists all enrollment applications for this institution (paginated, 10 per page), ordered by status priority (pending first).

**Response `200`**

```json
{
  "success": true,
  "applications": [
    {
      "id": 1,
      "student_id": 5,
      "student_name": "Sadid Ahmed",
      "student_email": "jane@example.com",
      "certificate_level_id": 1,
      "department_id": 2,
      "certificate_level_name": "Bachelor of Science",
      "department_name": "Computer Science",
      "batch": "2025",
      "reason": "Seeking higher education",
      "document_path": null,
      "status": "pending",
      "university_response": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "created_at": "2025-01-01T12:00:00Z",
      "certificates": [ ... ]
    }
  ],
  "pagination": { ... }
}
```

---

### POST `/university/enrollment-applications/{id}/approve`

Approves a pending enrollment application and creates an active enrollment record.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `batch` * | string | max:100 |
| `enrollment_date` * | string | date |
| `roll_number` | string | _(Optional)_, max:100, unique per institution |
| `program_level` | string | _(Optional)_, max:255 |
| `department_id` | integer | _(Optional)_, exists in departments |
| `expected_graduation_date` | string | _(Optional)_, date, after:enrollment_date |

**Response `201`**

```json
{
  "success": true,
  "message": "Application approved and student enrolled successfully",
  "enrollment": {
    "id": 1,
    "enrollment_number": "EXA-25-000001",
    "student_name": "Sadid Ahmed",
    "program": "...",
    "batch": "2025",
    "status": "active"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| `409` | Student is currently enrolled at another university |
| `409` | Student already has an active/suspended/withdrawal-requested enrollment at this institution |

---

### POST `/university/enrollment-applications/{id}/reject`

Rejects a pending enrollment application with a required reason.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `university_response` * | string | min:10, max:1000 |

**Response `200`**

```json
{ "success": true, "message": "Application rejected" }
```

---

## 9. Verifier

All routes under `/verifier/*` require `[Auth]` and `[Role: verifier]`.

---

### GET `/verifier/dashboard`

Returns the verifier's stats and recent 10 verification attempts.

**Response `200`**

```json
{
  "stats": {
    "total_verifications": 500,
    "successful_verifications": 450,
    "failed_verifications": 50,
    "verifications_today": 5
  },
  "recent_verifications": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "result": "success",
      "verified_at": "2025-01-01 12:00",
      "details": "Certificate verified successfully"
    }
  ]
}
```

---

### POST `/verifier/verify`

Verifies a certificate (same logic as public `/verify/certificate` but logs the attempt under the verifier's account).

**Request Body / Response** — Same as `POST /verify/certificate`.

---

### GET `/verifier/verifications/recent`

Returns the verifier's last 10 verification attempts with masked serial numbers and anonymized student names.

**Response `200`**

```json
{
  "success": true,
  "verifications": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "serial_masked": "BSC-25-***01A",
      "student_name": "Jane D.",
      "institution": "Example University",
      "status": "success",
      "verified_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### GET `/verifier/verifications/history`

Returns paginated verification history with optional filters (25 per page).

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | _(Optional)_, `success`, `failed`, `all` |
| `serial` | string | _(Optional)_, partial match |
| `from` | string | _(Optional)_, date `YYYY-MM-DD` |
| `to` | string | _(Optional)_, date `YYYY-MM-DD` |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "student_name": "Sadid Ahmed",
      "institution": "Example University",
      "status": "success",
      "verified_at": "2025-01-01 12:00",
      "details": "Certificate verified successfully",
      "certificate": {
        "serial": "BSC-25-000001A",
        "certificate_level": "Bachelor of Science",
        "program": "Computer Science",
        "major": null,
        "registration_no": "ENR-25-000001",
        "cgpa": "3.75",
        "issue_date": "2025-05-15",
        "completion_date": "2025-06-20",
        "student_name": "Sadid Ahmed",
        "student_id": "ENR-25-000001",
        "institution": "Example University"
      }
    }
  ],
  "total": 100,
  "per_page": 25,
  "current_page": 1,
  "last_page": 4
}
```

---

### GET `/verifier/verifications/export`

Exports verification history as a CSV file. Accepts same query parameters as `/verifier/verifications/history`.

**Response** — CSV file download (`verifications_export_YYYY-MM-DD.csv`).  
**Columns:** `Serial Number`, `Student Name`, `Institution`, `Status`, `Verified At`, `Details`

---

### GET `/verifier/students/search`

Searches for a student by email or NID/birth certificate number (exact match only). Returns nothing if the student has opted out of verifier search.

**Query Parameters**

| Param | Type | Rules |
|-------|------|-------|
| `query` * | string | min:3; must be a valid email or 10–17 digit NID |

**Response `200`**

```json
{
  "success": true,
  "students": [
    {
      "id": 5,
      "name": "Sadid Ahmed",
      "enrollment_status": "enrolled",
      "institution": "Example University",
      "has_active_request": false,
      "has_pending_request": false
    }
  ]
}
```

_(Email is only included if the student has enabled `show_email_to_verifiers`.)_

---

### GET `/verifier/students/{studentId}`

Returns a student's profile for the verifier. Returns `403` if the student's profile is set to private.

**Response `200`**

```json
{
  "success": true,
  "student": {
    "id": 5,
    "student_id": null,
    "name": "Sadid Ahmed",
    "institution": "Example University",
    "has_active_access": false,
    "has_pending_request": false,
    "profile_visibility": "verifiers_only"
  }
}
```

---

### POST `/verifier/access-requests`

Submits a certificate access request for a specific student.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `student_id` * | integer | exists in students |
| `purpose` * | string | min:20, max:1000 |

**Response `201`**

```json
{ "success": true, "message": "Access request sent successfully." }
```

**Errors**

| Status | Condition |
|--------|-----------|
| `409` | Already have active access to this student |
| `409` | Already have a pending request for this student |

---

### GET `/verifier/access-requests`

Lists all of the verifier's certificate access requests.

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "verifier_id": 3,
      "student_id": 5,
      "purpose": "Employment verification",
      "status": "pending",
      "created_at": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### DELETE `/verifier/access-requests/{id}`

Cancels (hard deletes) a pending access request.

**Response `200`**

```json
{ "success": true, "message": "Access request cancelled." }
```

---

### GET `/verifier/accessible-students`

Lists all students the verifier currently has active (non-revoked) access to, including their certificates.

**Response `200`**

```json
{
  "success": true,
  "accesses": [
    {
      "id": 1,
      "verifier_id": 3,
      "student_id": 5,
      "student_name": "Sadid Ahmed",
      "student_email": "jane@example.com",
      "student_identifier": null,
      "granted_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-07-01T00:00:00Z",
      "revoked_at": null,
      "is_active": true,
      "certificates": [
        {
          "id": 1,
          "serial": "BSC-25-000001A",
          "certificate_name": "Bachelor of Science",
          "certificate_level": "Bachelor of Science",
          "program": "Computer Science",
          "issue_date": "2025-05-15",
          "revoked_at": null,
          "is_public": true
        }
      ]
    }
  ]
}
```

---

## 10. Admin

All routes under `/admin/*` require `[Auth]` and `[Role: admin]`.

---

### GET `/admin/dashboard`

Returns platform-wide statistics. Results are cached for 60 seconds.

**Response `200`**

```json
{
  "stats": {
    "total_users": 1500,
    "pending_approvals": 10,
    "total_certificates": 8000,
    "total_activity": 25000,
    "pending_profile_changes": 3,
    "total_universities": 25,
    "total_students": 1200,
    "activity_today": 150,
    "recent_verifications": 500
  }
}
```

---

### GET `/admin/search`

Global search across users, certificates, and activity logs.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` * | string | Search term |
| `per_page` | integer | _(Optional)_, results per category (default 5) |

**Response `200`**

```json
{
  "success": true,
  "results": {
    "users": { "data": [ ... ], "total": 10, ... },
    "certificates": { "data": [ ... ], "total": 5, ... },
    "activities": { "data": [ ... ], "total": 2, ... }
  }
}
```

---

### GET `/admin/pending-users`

Lists all users with `is_approved = false` (students, universities, verifiers).

**Response `200`**

```json
{
  "pending_users": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "student",
      "name": "Sadid Ahmed",
      "is_approved": false,
      "student": { ... },
      "institution": null,
      "verifier": null
    }
  ]
}
```

---

### POST `/admin/approve-user/{id}`

Approves a pending user registration. Sends approval notification email and in-app notification.

**Response `200`**

```json
{
  "message": "User approved successfully.",
  "user": { ... }
}
```

---

### POST `/admin/reject-user/{id}`

Rejects and soft-deletes a pending user registration along with their profile record. Sends rejection notification email.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `reason` * | string | max:1000 |

**Response `200`**

```json
{ "message": "User rejected successfully." }
```

---

### POST `/admin/users/{id}/suspend`

Suspends an approved user account (not applicable to admins).

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `reason` * | string | max:1000 |

**Response `200`**

```json
{ "message": "User suspended successfully." }
```

---

### POST `/admin/users/{id}/unsuspend`

Lifts a suspension on a user account.

**Response `200`**

```json
{ "message": "User unsuspended successfully." }
```

---

### GET `/admin/users`

Lists all users with filtering and pagination.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | _(Optional)_, `pending`, `approved` |
| `role` | string | _(Optional)_, `student`, `university`, `verifier`, `admin`, `all` |
| `search` | string | _(Optional)_, search by email, name, institution, company |
| `date_from` | string | _(Optional)_, date |
| `date_to` | string | _(Optional)_, date |
| `per_page` | integer | _(Optional)_, max 100 (default 25) |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "student",
      "name": "Sadid Ahmed",
      "is_approved": true,
      "email_verified_at": "2025-01-01T00:00:00Z",
      "created_at": "2025-01-01T00:00:00Z",
      "suspended_at": null,
      "enrollment_institution": "Example University",
      "certificates_count": 2
    }
  ],
  "total": 1200,
  "per_page": 25,
  "current_page": 1,
  "last_page": 48,
  "pending_count": 10
}
```

---

### GET `/admin/users/export`

Exports the user list as a CSV file. Accepts same filters as `GET /admin/users` except pagination params.

**Response** — CSV file download (`users_export_YYYY-MM-DD.csv`).  
**Columns:** `Name`, `Email`, `Role`, `Approved`, `Email Verified`, `Registered`

---

### GET `/admin/users/{id}`

Returns full profile details for a single user, including role-specific stats.

**Response `200`**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student",
    "name": "Sadid Ahmed",
    "is_approved": true,
    "approved_at": "2025-01-01T00:00:00Z",
    "approved_by_name": "Admin",
    "email_verified_at": "2025-01-01T00:00:00Z",
    "created_at": "2025-01-01T00:00:00Z",
    "suspended_at": null,
    "suspension_reason": null,
    "profile": {
      "first_name": "Jane",
      "middle_name": null,
      "last_name": "Doe",
      "gender": "female",
      "date_of_birth": "2000-01-01",
      "phone": "01700000000",
      "address": "Dhaka",
      "nid_display": "1234567890",
      "current_student_id": "CS-001"
    },
    "enrollments_summary": [ ... ],
    "stats": {
      "total_certificates": 2,
      "public_certificates": 1,
      "private_certificates": 1,
      "revoked_certificates": 0,
      "total_enrollments": 1,
      "active_enrollments": 1
    }
  }
}
```

---

### GET `/admin/users/{id}/certificates`

Lists certificates for a student or university user (paginated, 25 per page).

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | _(Optional)_, search by serial or certificate name |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "certificate_name": "Bachelor of Science",
      "certificate_level": "Bachelor of Science",
      "department": "Computer Science",
      "major": null,
      "cgpa": "3.75",
      "issue_date": "2025-05-15",
      "revoked_at": null,
      "student_name": "Sadid Ahmed",
      "institution_name": "Example University"
    }
  ],
  "total": 2,
  "current_page": 1,
  "last_page": 1
}
```

---

### GET `/admin/users/{id}/enrollments`

Lists enrollments for a student or university user (paginated, 25 per page).

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_name": "Sadid Ahmed",
      "student_id_number": "ENR-25-000001",
      "institution_name": "Example University",
      "enrollment_number": "ENR-25-000001",
      "program": "BSc — Computer Science",
      "batch": "2025",
      "status": "active",
      "roll_number": "CS-001",
      "enrollment_date": "2025-01-01",
      "expected_grad": "2029-01-01",
      "actual_grad": null
    }
  ],
  "total": 1,
  "current_page": 1,
  "last_page": 1
}
```

---

### GET `/admin/users/{id}/activity`

Returns paginated activity log for a specific user (50 per page).

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `action` | string | _(Optional)_, filter by action |
| `from` | string | _(Optional)_, date |
| `to` | string | _(Optional)_, date |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "STUDENT_ENROLLED",
      "description": "Enrolled student Sadid Ahmed in BSc — Computer Science",
      "ip_address": "127.0.0.1",
      "metadata": null,
      "created_at": "2025-01-01 12:00:00"
    }
  ],
  "total": 50,
  "current_page": 1,
  "last_page": 1
}
```

---

### GET `/admin/certificates`

Lists all certificates on the platform (via shared `CertificateController::index`). Supports serial number search.

**Response `200`**

```json
{
  "success": true,
  "certificates": [
    {
      "id": 1,
      "serial": "BSC-25-000001A",
      "student_name": "Sadid Ahmed",
      "institution": "Example University",
      "certificate_name": "Bachelor of Science",
      "issue_date": "2025-05-15",
      "revoked_at": null
    }
  ]
}
```

---

### GET `/admin/certificates/{id}/details`

Returns full details of any certificate, including verification count and history.

**Response `200`**

```json
{
  "success": true,
  "certificate": {
    "id": 1,
    "serial": "BSC-25-000001A",
    "certificate_level": "Bachelor of Science",
    "certificate_name": "Bachelor of Science",
    "department": "Computer Science",
    "major": null,
    "session": "Spring 2025",
    "cgpa": "3.75",
    "degree_class": "First Class",
    "issue_date": "2025-05-15",
    "convocation_date": "2025-06-20",
    "authority_name": "Prof. Dr. Sayem Prodhan",
    "authority_title": "Vice Chancellor",
    "is_publicly_shareable": true,
    "revoked_at": null,
    "revocation_reason": null,
    "revoked_by_name": null,
    "revoked_by_role": null,
    "revocation_history": [],
    "student": {
      "id": 5,
      "user_id": 1,
      "full_name": "Sadid Ahmed",
      "student_id": "ENR-25-000001",
      "dob_masked": "••••-••-01"
    },
    "institution": {
      "id": 1,
      "name": "Example University",
      "user_id": 2
    },
    "enrollment": {
      "program": "BSc — Computer Science",
      "batch": "2025",
      "status": "graduated"
    },
    "issued_by_name": "Admin User",
    "verification_count": 12,
    "last_verified_at": "2025-06-01T00:00:00Z",
    "share_link": "https://..."
  }
}
```

---

### POST `/admin/certificates/{id}/restore`

Restores any revoked certificate (admin can restore regardless of who revoked it).

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `reason` * | string | min:10, max:1000 |

**Response `200`**

```json
{
  "message": "Certificate restored successfully.",
  "certificate": {
    "id": 1,
    "serial": "BSC-25-000001A",
    "revoked_at": null,
    "revoked_by_role": null,
    "revocation_reason": null,
    "revocation_history": [ ... ]
  }
}
```

---

### GET `/admin/analytics`

Returns comprehensive platform analytics including trends, university summaries, and verifier stats.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `days` | integer | _(Optional)_, lookback window in days (default 30) |

**Response `200`**

```json
{
  "overview": {
    "totalUsers": 1500,
    "totalStudents": 1200,
    "totalUniversities": 25,
    "totalVerifiers": 80,
    "totalCertificates": 8000,
    "pendingApprovals": 10,
    "pendingProfileChanges": 3,
    "activityToday": 150,
    "totalVerifications": 5000
  },
  "trends": {
    "registrations": [ { "date": "2025-01-01", "count": 5 } ],
    "certificatesIssued": [ { "date": "2025-01-01", "count": 20 } ],
    "verifications": [ { "date": "2025-01-01", "count": 50 } ]
  },
  "topUniversities": [
    { "name": "Example University", "certificates_count": 500 }
  ],
  "recentActivity": [
    { "action": "CERTIFICATE_ISSUED", "user": "admin@example.com", "time": "2025-01-01 12:00:00", "description": "..." }
  ],
  "universityAnalytics": {
    "totalActiveStudents": 800,
    "certificatesIssuedAllTime": 8000,
    "certificatesIssuedThisMonth": 100,
    "enrollmentTrend": [ { "month": "Jan 2025", "count": 50 } ],
    "departmentBreakdown": [ { "program": "BSc — CS", "count": 300 } ],
    "perUniversitySummary": [
      { "name": "Example University", "enrolled": 300, "issued": 500, "graduation_rate": 85.5 }
    ]
  },
  "verifierAnalytics": {
    "totalVerifications": 5000,
    "verificationsThisMonth": 200,
    "activeAccessGrants": 45,
    "verificationSuccessRate": 90.0,
    "verificationTrend": [ { "month": "Jan 2025", "count": 200 } ],
    "mostVerifiedInstitutions": [
      { "name": "Example University", "verifications_count": 1200 }
    ]
  }
}
```

---

### GET `/admin/profile-change-requests`

Lists all profile change requests across all users (paginated, 15 per page), pending first by default.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | _(Optional)_, `pending`, `approved`, `rejected` |
| `field_name` | string | _(Optional)_, filter by field |
| `role` | string | _(Optional)_, filter by user role |

**Response `200`**

```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "user_id": 5,
      "user_email": "jane@example.com",
      "user_role": "student",
      "user_name": "Sadid Ahmed",
      "field_name": "first_name",
      "field_label": "First Name",
      "current_value": "Jane",
      "requested_value": "Janet",
      "reason": "Legal name change",
      "has_documents": true,
      "document_count": 1,
      "status": "pending",
      "review_notes": null,
      "reviewer_email": null,
      "created_at": "2025-01-01 12:00:00",
      "updated_at": "2025-01-01 12:00:00",
      "certificate_count": 2
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  },
  "pending_count": 3
}
```

---

### GET `/admin/profile-change-requests/{id}`

Returns full details of a single profile change request, including document download links.

**Response `200`**

```json
{
  "success": true,
  "request": {
    "id": 1,
    "...": "...",
    "certificate_count": 2,
    "documents": [
      {
        "index": 0,
        "filename": "name_change_doc.pdf",
        "url": "/api/admin/profile-change-requests/1/documents/0"
      }
    ]
  }
}
```

---

### POST `/admin/profile-change-requests/{id}/approve`

Approves a profile change request and applies the change to the user's record.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `review_notes` | string | _(Optional)_ |

**Response `200`**

```json
{ "success": true, "message": "Change request approved and applied successfully." }
```

---

### POST `/admin/profile-change-requests/{id}/reject`

Rejects a profile change request with a required reason.

**Request Body**

| Field | Type | Rules |
|-------|------|-------|
| `review_notes` * | string | min:5, max:1000 |

**Response `200`**

```json
{ "success": true, "message": "Change request has been rejected." }
```

---

### GET `/admin/profile-change-requests/{id}/documents/{index}`

Downloads a supporting document attached to a profile change request.

**Path Parameters**

| Param | Description |
|-------|-------------|
| `id` | Profile change request ID |
| `index` | Zero-based document index |

**Response** — File download stream.

---

### GET `/admin/activity-logs`

Returns paginated activity logs (20 per page) with time and type filters.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `filter` | string | _(Optional)_, `today`, `this_week`, `this_month`, `all` (default) |
| `type` | string | _(Optional)_, `user_action`, `certificate`, `enrollment`, `system`, `all` (default) |

**Response `200`**

```json
{
  "success": true,
  "logs": {
    "data": [
      {
        "id": 1,
        "user_name": "Sadid Ahmed",
        "user_role": "student",
        "action_description": "Enrolled student Sadid Ahmed in BSc — Computer Science",
        "target": "Enrollment #1",
        "ip_address": "127.0.0.1",
        "created_at": "01/01/2025 12:00"
      }
    ],
    "current_page": 1,
    "last_page": 10,
    "total": 200
  }
}
```

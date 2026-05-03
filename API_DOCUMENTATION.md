# API Documentation

**Base URL:** `http://localhost:8000/api`

## Authentication & Errors

**Protected endpoints** require: `Authorization: Bearer <token>`

Tokens are issued via Laravel Sanctum on login. Previous tokens are revoked on each new login. Verification codes are 6-digit, hashed, and expire after 10 minutes.

**Auth flow:** Register → Verify email → Admin approves → Login → Use token

**Error formats:**

| Type | Status | Shape |
|------|--------|-------|
| Validation | 422 | `{ "errors": { "field": ["message"] } }` |
| General | 401 / 403 / 404 / 409 / 500 | `{ "error": "message" }` |

---

## Schemas

### User

```json
{
  "id": 1,
  "email": "john@example.com",
  "role": "student",
  "is_approved": true,
  "email_verified_at": "2025-01-01T00:00:00.000000Z",
  "student": { "first_name": "John", "last_name": "Doe", "student_id": "011221100", "..." },
  "institution": null,
  "verifier": null,
  "certificates_count": 3
}
```

> Only the matching role relation is populated; others are `null`.

### Certificate (student view)

```json
{
  "id": 1,
  "serial": "BSC-25-000001M",
  "degree_title": "Bachelor of Science in Computer Science",
  "program_name": "Computer Science and Engineering",
  "major": "Software Engineering",
  "registration_no": "0112211001234",
  "cgpa": "3.75",
  "issue_date": "2025-06-15",
  "completion_date": "2025-05-30",
  "institution_name": "United International University",
  "is_public": true,
  "revoked_at": null
}
```

### Certificate (verification view)

```json
{
  "serial": "BSC-25-000001M",
  "student_name": "John Doe",
  "student_id": "011221100",
  "degree_title": "Bachelor of Science in Computer Science",
  "program_name": "Computer Science and Engineering",
  "major": "Software Engineering",
  "registration_no": "0112211001234",
  "cgpa": 3.75,
  "issue_date": "2025-06-15",
  "completion_date": "2025-05-30",
  "institution": "United International University",
  "issued_by": "N/A",
  "status": "valid",
  "is_public": true
}
```

---

## Auth Endpoints

All auth endpoints are **public** except logout and me.

### POST /auth/register

Register a new account. Sends a 6-digit verification code via SMTP.

**Body:** `{ email, password, password_confirmation, role, ...role_fields }`

| Field | student | university | verifier |
|-------|:-------:|:----------:|:--------:|
| `first_name`, `last_name`, `nid`, `date_of_birth`, `student_id` | ✓ | — | — |
| `middle_name` | optional | — | — |
| `name`, `registration_number`, `city` | — | ✓ | — |
| `company_name`, `contact_person`, `purpose` | — | — | ✓ |
| `designation` | — | — | optional |
| `phone` | ✓ | ✓ | ✓ |
| `address` | ✓ | ✓ | optional |

**Response (201):**
```json
{
  "message": "Registration saved. Please check your email for the verification code.",
  "data": { "email": "john@example.com", "role": "student", "verification_code": "482910" }
}
```
> `verification_code` is only returned when `APP_ENV=local`.

### POST /auth/verify-email

Verify the 6-digit code. Creates the user account on success.

**Body:** `{ "email": "...", "code": "482910" }`

**Response (200):** `{ "message": "Email verified successfully.", "redirect_url": "/email-verified" }`

**Errors:** `422` — invalid/expired code

### POST /auth/resend-verification

Resend verification code (new code, 10-min expiry).

**Body:** `{ "email": "..." }`

**Response (200):** `{ "message": "Verification code resent successfully." }`

**Errors:** `404` — no pending registration found

### POST /auth/login

Authenticate and receive a Bearer token. Requires verified email + admin approval.

**Body:** `{ "email": "...", "password": "..." }`

**Response (200):**
```json
{
  "message": "Login successful.",
  "token": "1|abc123...",
  "token_type": "Bearer",
  "user": { "<<User schema>>" }
}
```

**Errors:** `401` — invalid credentials · `403` — email not verified or not approved

### POST /auth/logout `🔒`

Revoke current token. No body required.

**Response (200):** `{ "message": "Logged out successfully." }`

### GET /auth/me `🔒`

Get authenticated user profile.

**Response (200):** `{ "user": { "<<User schema>>" } }`

---

## Verification

### POST /verify/certificate

Verify a certificate publicly using serial + student's date of birth.

**Auth:** Public

**Body:** `{ "serial": "BSC-25-000001M", "date_of_birth": "2000-01-15" }`

**Response (200):**
```json
{ "success": true, "verified": true, "message": "...", "certificate": { "<<Certificate (verification view)>>" } }
```

| Error | Status | Message |
|-------|--------|---------|
| Not found | 404 | Certificate not found with this serial number |
| DOB mismatch | 401 | Date of birth does not match our records |
| Private | 403 | This certificate is private and cannot be verified |
| Revoked | 409 | This certificate has been revoked and is no longer valid |

---

## Student Endpoints `🔒 role:student`

### GET /student/dashboard

Stats and 5 most recent certificates.

**Response (200):**
```json
{
  "success": true,
  "stats": { "total_certificates": 3, "public_certificates": 2, "private_certificates": 1, "revoked_certificates": 0 },
  "recent_certificates": [{ "id": 1, "serial": "...", "degree_title": "...", "institution_name": "...", "issue_date": "...", "is_public": true }]
}
```

### GET /student/certificates

List all certificates. Response includes `certificates` array (Certificate schema + `created_at`) and `total` count.

### GET /student/certificates/{id}

Single certificate details. Returns Certificate schema. `404` if not found.

### POST /student/certificates/{id}/toggle-visibility

Toggle between public and private.

**Response (200):** `{ "success": true, "message": "Certificate is now private", "is_public": false }`

---

## University Endpoints `🔒 role:university`

### GET /university/dashboard

Institution info, stats, and 5 most recent certificates.

**Response (200):**
```json
{
  "institution": { "id": 1, "name": "...", "registration_number": "...", "city": "..." },
  "stats": { "total_certificates": 10, "active_certificates": 9, "revoked_certificates": 1 },
  "recent_certificates": ["..."]
}
```

### POST /university/certificates

Issue a certificate. Serial is auto-generated.

**Body:**
```json
{
  "student_id": "011221100",
  "degree_title": "Bachelor of Science in Computer Science",
  "program_name": "Computer Science and Engineering",
  "major": "Software Engineering",
  "registration_no": "0112211001234",
  "cgpa": 3.75,
  "issue_date": "2025-06-15",
  "completion_date": "2025-05-30"
}
```

| Field | Required | Notes |
|-------|:--------:|-------|
| `student_id` | ✓ | string, max 50 |
| `degree_title` | ✓ | string, max 255 |
| `issue_date` | ✓ | date |
| `program_name`, `major`, `registration_no` | — | string |
| `cgpa` | — | numeric, 0–4 |
| `completion_date` | — | date, ≥ issue_date |

**Response (201):** `{ "message": "Certificate issued successfully.", "certificate": { "..." } }`

**Errors:** `422` — validation or student not found

---

## Verifier Endpoints `🔒 role:verifier`

### GET /verifier/dashboard

Stats and 10 most recent verification attempts.

**Response (200):**
```json
{
  "stats": { "total_verifications": 25, "successful_verifications": 20, "failed_verifications": 5, "verifications_today": 3 },
  "recent_verifications": [{ "id": 1, "serial": "...", "result": "success", "verified_at": "2025-06-20 14:30", "details": "..." }]
}
```

### POST /verifier/verify

Same as `POST /verify/certificate`, but logs the attempt under the verifier's account.

**Body:** `{ "serial": "...", "date_of_birth": "..." }`

---

## Admin Endpoints `🔒 role:admin`

### GET /admin/dashboard

System-wide stats.

**Response (200):**
```json
{ "stats": { "total_users": 12, "pending_approvals": 3, "total_certificates": 8, "total_activity": 45 } }
```

### GET /admin/pending-users

List users awaiting approval. Returns `pending_users` array of User schema objects.

### POST /admin/approve-user/{id}

Approve a pending user. No body required.

**Response (200):** `{ "message": "User approved successfully.", "user": { "..." } }`

**Errors:** `404` — user not found · `422` — already approved

### POST /admin/reject-user/{id}

Reject and permanently delete a user. Sends rejection email.

**Body:** `{ "reason": "Incomplete documentation." }`

**Response (200):** `{ "message": "User rejected successfully." }`

**Errors:** `404` — user not found · `422` — reason required

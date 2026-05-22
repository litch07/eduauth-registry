# EduAuth Registry — API Reference

**Base URL:** `http://localhost:8000/api`

All protected routes (🔒) require:
```
Authorization: Bearer <token>
```

Tokens are issued on login and expire after **7 days**. Each new login revokes all previous tokens.

**Registration flow:** `Register → Email verification (6-digit OTP, 10 min) → Admin approval → Login`

**Error format:**
| Status | Body |
|--------|------|
| `422` | `{ "errors": { "field": ["msg"] } }` |
| `401/403/404/409/500` | `{ "error": "message" }` |

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new account |
| `POST` | `/auth/verify-email` | Submit the 6-digit email OTP |
| `POST` | `/auth/resend-verification` | Resend the verification code |
| `POST` | `/auth/login` | Login — returns a Bearer token |
| `POST` | `/auth/logout` 🔒 | Revoke the current token |
| `GET`  | `/auth/me` 🔒 | Get authenticated user profile |

### `POST /auth/register`
**Body:** `{ email, password, password_confirmation, role, ...role_fields }`

| Field | Student | University | Verifier |
|-------|:-------:|:----------:|:--------:|
| `first_name`, `last_name` | ✓ | — | — |
| `middle_name` | optional | — | — |
| `nid`, `date_of_birth` | ✓ | — | — |
| `name`, `registration_number`, `city` | — | ✓ | — |
| `company_name`, `contact_person`, `purpose` | — | — | ✓ |
| `designation` | — | — | optional |
| `phone` | ✓ | ✓ | ✓ |
| `address` | ✓ | ✓ | optional |

> `verification_code` is included in the `201` response only when `APP_ENV=local`.

### `POST /auth/login`
**Response `200`:**
```json
{
  "token": "1|abc123...",
  "token_type": "Bearer",
  "user": { "id": 1, "email": "...", "role": "student", "is_approved": true }
}
```
**Errors:** `401` wrong credentials · `403` email not verified or pending approval

---

## Profile 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/profile` | Get full profile |
| `PUT`  | `/profile` | Update editable profile fields |
| `PUT`  | `/profile/password` | Change password |
| `GET`  | `/profile/activity` | Last 50 activity entries (paginated) |
| `GET`  | `/profile/change-requests` | Student's own change request history |
| `POST` | `/profile/change-requests` | Submit a change request (multipart, supports document upload) |
| `DELETE` | `/profile/change-requests/{id}` | Cancel a pending request |

Editable fields by role: **Student** — `phone`, `address` · **University** — `phone`, `address`, `website` · **Verifier** — `phone`, `website`

Change requests support `field_name`, `new_value`, `reason`, and optional `documents[]` file uploads.

---

## Notifications 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/notifications` | 10 most recent notifications + unread count |
| `GET`  | `/notifications/all` | All notifications (paginated) |
| `GET`  | `/notifications/unread-count` | Unread count only |
| `POST` | `/notifications/{id}/read` | Mark one as read |
| `POST` | `/notifications/read-all` | Mark all as read |

---

## Settings 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/settings` | Get current notification and privacy settings |
| `PUT`  | `/settings` | Update settings (send only the fields to change) |
| `POST` | `/settings/reset` | Reset all settings to defaults |

Settings fields: `default_certificate_visibility` (`public`/`private`), `notify_access_request`, `notify_certificate_issued`, `notify_access_approved`, `notify_access_rejected`, `notify_profile_change`.

---

## Public Verification

### `POST /verify/certificate`
Verify a certificate — no login required.

**Body:** `{ "serial": "BSC-26-000001B", "date_of_birth": "2002-01-01" }`

| Outcome | Status | Response |
|---------|--------|----------|
| Valid | `200` | `verified: true`, full certificate object |
| Revoked | `200` | `verified: false`, `status: "revoked"` |
| Not found | `404` | — |
| DOB mismatch | `401` | — |
| Private | `403` | — |

### `GET /verify-link`
Verify from an encrypted share link — DOB is decrypted automatically.

**Query:** `?s=<serial>&v=<encrypted_token>`

### `GET /certificates/{id}/pdf` 🔒
Download a certificate as a PDF. Revoked certificates cannot be downloaded.

---

## Student 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/student/dashboard` | Stats + 5 most recent certificates |
| `GET`  | `/student/certificates` | All certificates |
| `GET`  | `/student/certificates/{id}` | Single certificate details |
| `POST` | `/student/certificates/{id}/toggle-visibility` | Toggle public/private |
| `GET`  | `/student/access-requests` | Incoming verifier requests (grouped by status) |
| `POST` | `/student/access-requests/{id}/approve` | Approve with duration: `7`, `30`, `90`, or `365` days |
| `POST` | `/student/access-requests/{id}/reject` | Reject (body: `{ "rejection_reason": "..." }`, 10–1000 chars) |
| `GET`  | `/student/granted-access` | All active and past access grants |
| `POST` | `/student/granted-access/{id}/revoke` | Immediately revoke an access grant |
| `POST` | `/student/withdrawal/request` | Submit withdrawal request (body: `{ "reason": "..." }`, min 20 chars) |
| `GET`  | `/student/withdrawal/requests` | View own withdrawal request history |

---

## University 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/university/dashboard` | Institution overview, stats, recent certificates |
| `GET`    | `/university/enrollments` | List enrollments (`?status=active&search=sadid&per_page=15`) |
| `POST`   | `/university/enrollments` | Enroll a student |
| `PATCH`  | `/university/enrollments/{id}/status` | Update enrollment status |
| `PATCH`  | `/university/enrollments/{id}/extend-graduation` | Extend graduation date |
| `POST`   | `/university/enrollments/{id}/withdraw` | Forcibly withdraw a student |
| `GET`    | `/university/withdrawal/pending` | Pending withdrawal requests |
| `POST`   | `/university/withdrawal/{id}/approve` | Approve a withdrawal |
| `POST`   | `/university/withdrawal/{id}/reject` | Reject a withdrawal (body: `{ "note": "..." }`) |
| `GET`    | `/university/students/search` | Search students by email, student ID, or NID |
| `GET`    | `/university/certificates` | All certificates issued by this institution |
| `POST`   | `/university/certificates` | Issue a single certificate |
| `POST`   | `/university/certificates/batch` | Batch-issue via CSV upload |
| `GET`    | `/university/certificates/batch-template` | Download the CSV upload template |
| `POST`   | `/university/certificates/{id}/revoke` | Revoke a certificate |

### Enroll a Student
```json
{
  "student_email": "student@example.com",
  "program": "Bachelor of Science in Computer Science and Engineering",
  "batch": "Spring 2026",
  "enrollment_date": "2022-01-15",
  "expected_graduation_date": "2026-05-30"
}
```

### Issue a Certificate
```json
{
  "student_id": 1,
  "certificate_level": "undergraduate",
  "certificate_name": "Bachelor of Science in Computer Science and Engineering",
  "department": "Computer Science and Engineering",
  "session": "Spring 2026",
  "issue_date": "2026-05-15",
  "authority_name": "Prof. Dr. Md. Abul Kashem Mia",
  "authority_title": "Vice Chancellor"
}
```
Optional fields: `major`, `cgpa` (0.00–4.00), `degree_class`, `convocation_date`.
Serial auto-generated as `BSC-YY-SEQSEQ`. Errors: `403` not enrolled · `409` duplicate.

### Batch Upload CSV Columns
`student_email, certificate_level, cgpa, degree_class, issue_date, convocation_date` (max 2 MB)

Valid enrollment transitions: `active → graduated | suspended` · `suspended → active | withdrawn`

---

## Verifier 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/verifier/dashboard` | Verification stats |
| `POST` | `/verifier/verify` | Verify a certificate (logged) — `{ serial, date_of_birth }` |
| `GET`  | `/verifier/verifications/recent` | 10 most recent attempts (lightweight) |
| `GET`  | `/verifier/verifications/history` | Full paginated history (`?status&serial&from&to&page`) |
| `GET`  | `/verifier/verifications/export` | Download history as CSV |
| `GET`  | `/verifier/students/search` | Search students by exact email, student ID, or NID |
| `POST` | `/verifier/access-requests` | Send access request (`{ student_id, purpose }`, purpose 20–1000 chars) |
| `GET`  | `/verifier/access-requests` | All sent access requests |
| `GET`  | `/verifier/accessible-students` | Students with active access grants + visible certificates |

---

## Admin 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/admin/dashboard` | System-wide stats |
| `GET`  | `/admin/users` | Paginated user list (`?role&status&search&date_from&date_to&per_page`) |
| `GET`  | `/admin/users/export` | Export users as CSV |
| `GET`  | `/admin/users/{id}` | Full user details with stats and enrollment |
| `GET`  | `/admin/users/{id}/certificates` | User's certificates (paginated) |
| `GET`  | `/admin/users/{id}/enrollments` | User's enrollments (paginated) |
| `GET`  | `/admin/users/{id}/activity` | User's activity log (paginated) |
| `GET`  | `/admin/pending-users` | All users awaiting approval |
| `POST` | `/admin/approve-user/{id}` | Approve a pending user (sends email) |
| `POST` | `/admin/reject-user/{id}` | Reject a user (body: `{ "reason": "..." }`, sends email) |
| `GET`  | `/admin/certificates` | All certificates system-wide |
| `GET`  | `/admin/certificates/{id}/details` | Full certificate details with verification stats |
| `POST` | `/admin/certificates/{id}/revoke` | Revoke any certificate |
| `GET`  | `/admin/profile-change-requests` | All pending profile change requests |
| `GET`  | `/admin/profile-change-requests/{id}` | View a specific request with documents |
| `GET`  | `/admin/profile-change-requests/{id}/documents/{index}` | Download an attached document |
| `POST` | `/admin/profile-change-requests/{id}/approve` | Approve a change (updates profile automatically) |
| `POST` | `/admin/profile-change-requests/{id}/reject` | Reject a change (body: `{ "note": "..." }`) |
| `GET`  | `/admin/search` | Search across users, certificates, and activity (`?search&per_page`) |
| `GET`  | `/admin/analytics` | Trend data for analytics dashboard (`?days=30`) |

---

## Shared 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/certificates/search` | Search visible certificates (`?search&institution_id&certificate_level&date_from&date_to&status&per_page`) |
| `GET`  | `/students/search` | Search approved students (`?query=sadid`, min 2 chars) |

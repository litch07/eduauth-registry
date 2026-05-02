# API Documentation

This file lists the main API endpoints by area. Base URL example: `http://localhost:8000/api`.

---

## Authentication

- POST /auth/register
  - Auth: public
  - Body: { email, password, password_confirmation, role, ...role-specific fields }
  - Response: { message }

- POST /auth/login
  - Auth: public
  - Body: { email, password }
  - Response: { message, token, user }

- POST /auth/verify-email
  - Auth: public
  - Body: { email, code }
  - Response: { message }

- POST /auth/resend-verification
  - Auth: public
  - Body: { email }
  - Response: { message }

- POST /auth/logout
  - Auth: Sanctum (authenticated)
  - Body: none
  - Response: { message }

- GET /auth/me
  - Auth: Sanctum (authenticated)
  - Body: none
  - Response: { user }

---

## Public Verification

- POST /verify/certificate
  - Auth: public
  - Body: { serial, date_of_birth }
  - Response: { message, verified: boolean, certificate? }

---

## Student (requires role: student)

- GET /student/dashboard
  - Auth: Sanctum + role:student
  - Response: { stats }

- GET /student/certificates
  - Auth: Sanctum + role:student
  - Response: { certificates: [ { certificate } ] }

- GET /certificates/{id}/pdf
  - Auth: public for public certificates; Sanctum (authenticated) required for private certificates
  - URL params: { id }
  - Response: binary PDF stream (Content-Type: application/pdf) or 403/404

---

## University (requires role: university)

- GET /university/dashboard
  - Auth: Sanctum + role:university
  - Response: { stats }

- POST /university/certificates
  - Auth: Sanctum + role:university
  - Body: { student_id, degree_title, program_name, major, registration_no, cgpa, issue_date, is_public }
  - Response: { message, certificate }

- POST /university/certificates/{id}/revoke
  - Auth: Sanctum + role:university
  - URL params: { id }
  - Body: { reason }
  - Response: { message }

- POST /university/certificates/{id}/restore
  - Auth: Sanctum + role:university
  - URL params: { id }
  - Body: { reason }
  - Response: { message }

---

## Verifier (requires role: verifier)

- GET /verifier/dashboard
  - Auth: Sanctum + role:verifier
  - Response: { stats }

- POST /verifier/verify
  - Auth: Sanctum + role:verifier
  - Body: { serial, date_of_birth }
  - Response: { message, verified: boolean, certificate? }

- POST /certificate-requests
  - Auth: Sanctum + role:verifier
  - Body: { certificate_serial, reason }
  - Response: { message, request }

- GET /certificate-requests/{id}
  - Auth: Sanctum (student or admin or verifier depending on ownership)
  - URL params: { id }
  - Response: { request }

- POST /certificate-requests/{id}/approve
  - Auth: Sanctum + role:student (or admin)
  - URL params: { id }
  - Body: { note? }
  - Response: { message }

- POST /certificate-requests/{id}/reject
  - Auth: Sanctum + role:student (or admin)
  - URL params: { id }
  - Body: { reason }
  - Response: { message }

---

## Admin (requires role: admin)

- GET /admin/pending-users
  - Auth: Sanctum + role:admin
  - Response: { pending_users: [ { user } ] }

- POST /admin/approve-user/{id}
  - Auth: Sanctum + role:admin
  - URL params: { id }
  - Body: { reason? }
  - Response: { message, user }

- POST /admin/reject-user/{id}
  - Auth: Sanctum + role:admin
  - URL params: { id }
  - Body: { reason }
  - Response: { message }

- GET /admin/activity-logs
  - Auth: Sanctum + role:admin
  - Query: ?page=&limit=&user_id=
  - Response: { logs: [ { activity } ] }

- GET /admin/activity-logs/{id}
  - Auth: Sanctum + role:admin
  - URL params: { id }
  - Response: { activity }

---

Notes:
This document covers the primary API surface implemented in `backend/routes/api.php` and common additional endpoints used by the frontend. Protected routes require an authenticated Sanctum session or a personal access token. For SPA cookie-based authentication, request `GET /sanctum/csrf-cookie` before login and use Axios with `withCredentials: true`.

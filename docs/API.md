# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Most endpoints require JWT authentication. Include token in header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

---

## Public Endpoints

### Verify Certificate

Verify a certificate using Serial Number and Date of Birth (no authentication required).

```http
POST /verify/certificate
```

**Request Body:**
```json
{
  "serial": "BSC-25-0000011",
  "dateOfBirth": "15/01/2001"
}
```

**Response (200 - Success):**
```json
{
  "verified": true,
  "certificate": {
    "id": "uuid-string",
    "serial": "BSC-25-0000011",
    "certificateLevel": "BACHELOR",
    "certificateName": "Bachelor of Science in Computer Science",
    "studentFullName": "Sadid Ahmed",
    "studentId": "0112330154",
    "institutionName": "United International University",
    "department": "Computer Science and Engineering",
    "major": "Software Engineering",
    "cgpa": "3.75",
    "degreeClass": "First Class",
    "issueDate": "2024-06-15",
    "convocationDate": "2024-07-20",
    "authorityName": "Prof. Dr. Md. Abul Kashem Mia",
    "authorityTitle": "Vice Chancellor"
  }
}
```

**Response (404 - Not Found):**
```json
{
  "verified": false,
  "message": "Certificate not found or verification details do not match"
}
```

**Response (403 - Private Certificate):**
```json
{
  "verified": false,
  "message": "This certificate is private and requires approval from the student"
}
```

---

## Authentication Endpoints

### Register Student

Register a new student account.

```http
POST /auth/register/student
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securepassword123",
  "confirmPassword": "securepassword123",
  "firstName": "John",
  "middleName": "M",
  "lastName": "Doe",
  "dateOfBirth": "2001-01-15",
  "nid": "1234567890123",
  "fatherName": "Father Name",
  "motherName": "Mother Name",
  "phone": "01700000000",
  "presentAddress": "Dhaka, Bangladesh"
}
```

**Response (201 - Created):**
```json
{
  "data": {
    "userId": "uuid-string",
    "studentId": "uuid-string",
    "email": "student@example.com",
    "firstName": "John"
  },
  "message": "Student registered successfully. Please verify your email."
}
```

**Response (400 - Validation Error):**
```json
{
  "error": "Email already registered"
}
```

---

### Register University

Register a new university account (requires admin approval).

```http
POST /auth/register/university
```

**Request Body:**
```json
{
  "email": "university@example.com",
  "password": "securepassword123",
  "confirmPassword": "securepassword123",
  "name": "Example University",
  "registrationNumber": "REG-2024-001",
  "establishedYear": 2000,
  "phone": "09600000000",
  "address": "Dhaka, Bangladesh",
  "website": "https://example.edu.bd",
  "authorityName": "Prof. Dr. Name",
  "authorityTitle": "Vice Chancellor"
}
```

**Response (201 - Created):**
```json
{
  "data": {
    "userId": "uuid-string",
    "institutionId": "uuid-string",
    "email": "university@example.com",
    "name": "Example University"
  },
  "message": "University registered successfully. Awaiting admin approval."
}
```

---

### Register Verifier

Register a new verifier account (requires admin approval).

```http
POST /auth/register/verifier
```

**Request Body:**
```json
{
  "email": "verifier@example.com",
  "password": "securepassword123",
  "confirmPassword": "securepassword123",
  "companyName": "Company Name",
  "companyRegistration": "COM-2024-001",
  "website": "https://company.com",
  "contactPhone": "01700000000",
  "purpose": "Employment"
}
```

**Response (201 - Created):**
```json
{
  "data": {
    "userId": "uuid-string",
    "verifierId": "uuid-string",
    "email": "verifier@example.com",
    "companyName": "Company Name"
  },
  "message": "Verifier registered successfully. Awaiting admin approval."
}
```

---

### Login

Login with email and password.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 - Success):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "uuid-string",
      "email": "user@example.com",
      "role": "STUDENT",
      "emailVerified": true
    }
  },
  "message": "Login successful"
}
```

**Response (401 - Invalid Credentials):**
```json
{
  "error": "Invalid email or password"
}
```

---

### Send Email Verification Code

Send a 6-digit verification code to email.

```http
POST /auth/send-verification-code
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification code sent to email"
}
```

---

### Verify Email Code

Verify email using the 6-digit code.

```http
POST /auth/verify-email-code
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

---

## Student Endpoints

All student endpoints require `Authorization: Bearer <token>` and role `STUDENT`.

### Get Student Dashboard

Get student statistics and recent activity.

```http
GET /student/dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "studentName": "John Doe",
    "totalEnrollments": 2,
    "totalCertificates": 3,
    "pendingRequests": 2,
    "recentCertificates": [
      {
        "id": "uuid",
        "serial": "BSC-25-0000011",
        "certificateName": "Bachelor of Science",
        "issueDate": "2024-06-15"
      }
    ]
  }
}
```

---

### Get Student Certificates

Get all certificates issued to the student.

```http
GET /student/certificates
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "serial": "BSC-25-0000011",
      "certificateName": "Bachelor of Science in Computer Science",
      "institutionName": "United International University",
      "issueDate": "2024-06-15",
      "cgpa": "3.75",
      "isPubliclyShareable": true,
      "verificationCount": 5
    }
  ]
}
```

---

### Toggle Certificate Sharing

Toggle certificate privacy (public/private).

```http
PUT /student/certificates/:id/toggle-sharing
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "isPubliclyShareable": false
  },
  "message": "Certificate sharing updated"
}
```

---

### Get Certificate Requests

Get all access requests from verifiers.

```http
GET /student/certificate-requests
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "requestType": "ALL_CERTIFICATES",
      "verifierName": "Company Name",
      "purpose": "Employment",
      "reason": "Background verification required",
      "status": "PENDING",
      "createdAt": "2024-01-24T10:30:00Z",
      "expiresAt": "2024-01-31T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### Approve Certificate Request

Approve a verifier's access request.

```http
PUT /student/certificate-requests/:id/approve
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Request approved successfully"
}
```

---

### Reject Certificate Request

Reject a verifier's access request.

```http
PUT /student/certificate-requests/:id/reject
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Optional rejection reason"
}
```

**Response (200):**
```json
{
  "message": "Request rejected successfully"
}
```

---

## University Endpoints

All university endpoints require `Authorization: Bearer <token>` and role `UNIVERSITY`.

### Get University Dashboard

Get university statistics.

```http
GET /university/dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "universityName": "United International University",
    "totalStudents": 45,
    "totalCertificates": 120,
    "todayCertificates": 3,
    "recentCertificates": [
      {
        "id": "uuid",
        "serial": "BSC-25-0000011",
        "studentName": "John Doe",
        "issueDate": "2024-01-24"
      }
    ]
  }
}
```

---

### Get Enrolled Students

Get list of students enrolled at the university.

```http
GET /university/students
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `department` (optional): Filter by department
- `search` (optional): Search by name or email

**Response (200):**
```json
{
  "data": [
    {
      "enrollmentId": "uuid",
      "studentId": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "studentInstitutionId": "0112330154",
      "department": "Computer Science",
      "enrollmentDate": "2020-02-01",
      "certificatesIssued": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### Enroll Student

Enroll a student at the university.

```http
POST /university/students/enroll
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentEmail": "student@example.com",
  "studentInstitutionId": "0112330154",
  "department": "Computer Science and Engineering",
  "session": "2020-2024",
  "enrollmentDate": "2020-02-01"
}
```

**Response (201):**
```json
{
  "data": {
    "enrollmentId": "uuid",
    "studentId": "uuid",
    "studentEmail": "student@example.com"
  },
  "message": "Student enrolled successfully"
}
```

---

### Issue Certificate

Issue a certificate to an enrolled student.

```http
POST /university/certificates/issue
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "enrollmentId": "uuid",
  "certificateLevel": "BACHELOR",
  "certificateName": "Bachelor of Science in Computer Science",
  "department": "Computer Science and Engineering",
  "major": "Software Engineering",
  "session": "2020-2024",
  "cgpa": "3.75",
  "degreeClass": "First Class",
  "issueDate": "2024-06-15",
  "convocationDate": "2024-07-20"
}
```

**Response (201):**
```json
{
  "data": {
    "certificateId": "uuid",
    "serial": "BSC-25-0000011",
    "studentName": "John Doe"
  },
  "message": "Certificate issued successfully"
}
```

---

## Verifier Endpoints

All verifier endpoints require `Authorization: Bearer <token>` and role `VERIFIER`. Verifier must be approved (`isApproved: true`).

### Get Verifier Dashboard

Get verifier statistics.

```http
GET /verifier/dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "verifierName": "Company Name",
    "totalRequestsSent": 15,
    "pendingApprovals": 3,
    "approvedCount": 10,
    "activeAccessGrants": 8,
    "recentRequests": []
  }
}
```

---

### Search Student

Search students by NID and Date of Birth.

```http
GET /verifier/search-student
Authorization: Bearer <token>
```

**Query Parameters:**
- `nid` (required): National ID number
- `dateOfBirth` (required): Date of birth (DD/MM/YYYY)

**Response (200):**
```json
{
  "data": {
    "studentId": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "totalCertificates": 3,
    "hasPendingRequest": false
  }
}
```

**Response (404):**
```json
{
  "error": "Student not found"
}
```

---

### Request All Certificates

Request access to all certificates from a student.

```http
POST /verifier/request-all-certificates
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "uuid",
  "purpose": "Employment",
  "reason": "Candidate background verification for hiring process"
}
```

**Response (201):**
```json
{
  "data": {
    "requestId": "uuid",
    "studentId": "uuid",
    "status": "PENDING"
  },
  "message": "Certificate access request sent"
}
```

---

### Request Single Certificate

Request access to a specific certificate.

```http
POST /verifier/request-single-certificate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "uuid",
  "certificateId": "uuid",
  "purpose": "Employment",
  "reason": "Specific certificate verification needed"
}
```

**Response (201):**
```json
{
  "data": {
    "requestId": "uuid"
  },
  "message": "Certificate access request sent"
}
```

---

### Get My Requests

Get all sent requests with status.

```http
GET /verifier/my-requests
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "requestType": "ALL_CERTIFICATES",
      "studentName": "John Doe",
      "purpose": "Employment",
      "status": "APPROVED",
      "createdAt": "2024-01-20T10:00:00Z",
      "expiresAt": "2024-02-20T10:00:00Z"
    }
  ]
}
```

---

### Get Active Access

Get all active access grants.

```http
GET /verifier/active-access
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": [
    {
      "accessId": "uuid",
      "studentName": "John Doe",
      "accessType": "ALL_CERTIFICATES",
      "grantedAt": "2024-01-20T10:00:00Z",
      "expiresAt": "2024-02-20T10:00:00Z",
      "daysRemaining": 27
    }
  ]
}
```

---

### View Accessed Certificates

View certificates for a student (with active access).

```http
GET /verifier/view-certificates/:studentId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "studentName": "John Doe",
    "certificates": [
      {
        "id": "uuid",
        "serial": "BSC-25-0000011",
        "certificateName": "Bachelor of Science",
        "cgpa": "3.75",
        "issueDate": "2024-06-15"
      }
    ]
  }
}
```

**Response (403):**
```json
{
  "error": "You don't have access to view this student's certificates"
}
```

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>` and role `ADMIN`.

### Get Admin Dashboard

Get system statistics.

```http
GET /admin/dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "totalStudents": 150,
    "totalUniversities": 8,
    "totalVerifiers": 25,
    "totalCertificates": 450,
    "todayCertificates": 12,
    "totalVerifications": 1200,
    "todayVerifications": 45,
    "pendingVerifiers": 3,
    "newUsersThisWeek": 15
  }
}
```

---

### Get All Users

Get list of all users with filtering.

```http
GET /admin/users
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` (optional): `STUDENT`, `UNIVERSITY`, `VERIFIER`
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "STUDENT",
      "emailVerified": true,
      "createdAt": "2024-01-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 150
  }
}
```

---

### Get Verification Analytics

Get verification statistics.

```http
GET /admin/verification-analytics
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": {
    "topVerifiedCertificates": [
      {
        "serial": "BSC-25-0000011",
        "certificateName": "Bachelor of Science",
        "verificationCount": 45
      }
    ],
    "verificationsByCountry": [
      {
        "country": "Bangladesh",
        "count": 950
      },
      {
        "country": "India",
        "count": 180
      }
    ],
    "totalVerifications": 1200,
    "uniqueCountries": 15
  }
}
```

---

### Get Activity Logs

Get system activity audit trail.

```http
GET /admin/activity-logs
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `action` (optional): Filter by action type

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "actorType": "UNIVERSITY",
      "action": "CERTIFICATE_ISSUED",
      "targetType": "CERTIFICATE",
      "details": {
        "serial": "BSC-25-0000011"
      },
      "createdAt": "2024-01-24T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 500
  }
}
```

---

### Get Pending Verifiers

Get list of verifiers awaiting approval.

```http
GET /admin/pending-verifiers
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "companyName": "Company Name",
      "companyRegistration": "REG-001",
      "website": "https://company.com",
      "purpose": "Employment",
      "contactPhone": "01700000000",
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

### Approve Verifier

Approve a verifier registration.

```http
PUT /admin/verifiers/:id/approve
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Verifier approved successfully"
}
```

---

### Reject Verifier

Reject a verifier registration.

```http
PUT /admin/verifiers/:id/reject
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Insufficient company documentation"
}
```

**Response (200):**
```json
{
  "message": "Verifier rejected successfully"
}
```

---

## Error Codes

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created (certificate issued, user registered) |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't have permission for this action |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (duplicate email) |
| 500 | Internal Server Error | Server-side error |

---

## Rate Limiting

- **Certificate Access Requests:** 10 requests per day per verifier
- **Email Verification:** 5 codes per hour per email
- **General API:** 100 requests per minute per IP (development)

---

## Common Response Patterns

**Successful List Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "error": "Error message describing what went wrong"
}
```

**Created Response:**
```json
{
  "data": { ... },
  "message": "Resource created successfully"
}
```

---

## Testing with cURL

**Example: Verify a certificate**
```bash
curl -X POST http://localhost:5000/api/verify/certificate \
  -H "Content-Type: application/json" \
  -d '{
    "serial": "BSC-25-0000011",
    "dateOfBirth": "15/01/2001"
  }'
```

**Example: Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ssadidahmed01@gmail.com",
    "password": "password123"
  }'
```

**Example: Get Student Dashboard (with token)**
```bash
curl -X GET http://localhost:5000/api/student/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Pagination

List endpoints support pagination with these parameters:

- `page` (default: 1) - Current page number
- `limit` (default: 20) - Items per page (max: 100)

**Example:**
```
GET /student/certificate-requests?page=2&limit=10
```

---

## Date Formats

- **Input dates:** `DD/MM/YYYY` (e.g., `15/01/2001`)
- **Response dates:** ISO 8601 (e.g., `2024-01-24T10:30:00Z`)
- **Date only fields:** `YYYY-MM-DD` (e.g., `2024-01-24`)

---

For more information, see the [README](../README.md) or open an issue on GitHub.

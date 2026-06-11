# EduAuth Registry

EduAuth Registry is a web application for Bangladeshi universities to issue, manage, and verify academic certificates digitally. It covers the full lifecycle — from student enrollment to certificate issuance to third-party verification — with separate dashboards for admins, universities, students, and verifiers.

---

## What It Does

- **Certificate issuance with auto-generated serial numbers.** Universities issue certificates with serials in the format `PREFIX-YY-NNNNNNC` (e.g. `BSc-26-000001M`), where `PREFIX` comes from the `CertificateLevel` short code, `YY` is the two-digit year, `NNNNNN` is a zero-padded six-digit sequence, and `C` is a checksum character. Sequence numbers are generated inside a `SELECT FOR UPDATE` database transaction to prevent duplicates. Each certificate also gets an embedded QR code generated via `simplesoftwareio/simple-qrcode`.

- **Certificate visibility control owned by the student.** Each certificate has an `is_publicly_shareable` flag that the student toggles via `POST /student/certificates/{id}/toggle-visibility`. Universities cannot override this setting after issuance.

- **Public certificate verification by serial number or share link.** Any visitor can submit a serial number and optional date of birth to `POST /verify/certificate` without logging in. Certificates also carry a share link containing the serial and an AES-256-CBC encrypted DOB token, allowing one-click verification from a URL (`GET /verify-link`).

- **Revocation with a two-tier hierarchy.** Universities can revoke and unrevoke their own certificates. Admins can revoke any certificate and also restore ones revoked by universities. Each revocation appends a timestamped entry to the `revocation_history` JSON column, recording the action, the performer's user ID and name, their role, and the reason.

- **Verifier access request and approval flow.** Verifiers submit access requests to individual students (`POST /verifier/access-requests`). Students approve or reject each request (`POST /student/access-requests/{id}/approve`). On approval, a time-limited `verifier_access` record is created. Students can also revoke active access grants at any time.

- **Student enrollment management by universities.** Universities enroll students with a unique `enrollment_number`, program, batch, department, major, certificate level, and expected graduation date. Enrollment status transitions cover `active`, `graduated`, `suspended`, and `withdrawn`. Universities can update status, extend graduation dates, and directly withdraw students.

- **Student-initiated enrollment applications.** Students can browse registered universities and submit enrollment applications (`POST /student/enrollment-applications`) with a reason, supporting document, and consent flag. Universities review and approve or reject them through their dashboard.

- **Graduation extension requests with counter-offer support.** Students submit extension requests with a requested graduation date and reason (`POST /student/extension-requests`). Universities can approve, reject, or counter-offer with an alternative date. Students can then accept or decline the counter-offer.

- **Program (department/major) change requests.** Students can request a transfer to a different department or major within the same institution. Universities approve or reject these requests, which update the enrollment record on approval.

- **Department, major, and certificate level management.** Universities create and manage their own departments, majors, and certificate levels. Each has a `short_code` and an `is_active` flag; soft-deletion and reactivation are both supported.

- **NID stored as a hash for search plus AES-256-CBC ciphertext for display.** The `students` table stores a SHA-based `nid_hash` (64-character string, used for uniqueness checks) and a separate `nid_encrypted` column (AES-256-CBC via Laravel's `Crypt` facade). Authorized views decrypt the NID through `EncryptionService::decryptNid()`. The display value is masked; the hash cannot be reversed.

- **Email change with a token-based verification flow.** When a user requests an email change, the new address is stored in `pending_email` with a token and expiry in `pending_email_expires_at`. The change is committed only after the user verifies the token via `POST /auth/verify-email-change`. Users can cancel a pending change via `DELETE /profile/email-change`.

- **Admin approval, suspension, and account lifecycle.** New university and verifier accounts start with `is_approved = 0` and require admin approval before they can log in. Admins can also suspend any account (recording a `suspended_at` timestamp and `suspension_reason`) and unsuspend it later. All user accounts support soft-deletion.

- **Activity logging and audit trail.** The `activity_logs` table records every significant action with the user ID, action name, entity type and ID, a human-readable description, a JSON metadata blob, and the requester's IP address. Admins can query this log by user via `GET /admin/activity-logs`.

- **In-app notification system.** Notifications are stored in the `notifications` table (UUID primary key, Laravel's standard notifiable pattern). Users fetch unread counts, mark individual or all notifications as read. The `NotificationContext` in the frontend polls for unread counts.

- **Role-based settings with granular privacy controls.** Each user has a `user_settings` record with fields for `profile_visibility` (`verifiers_only` default), `allow_verifier_search`, `show_email_to_verifiers`, and `show_institution_to_public`. The `preferences` JSON column stores role-specific defaults — for example, students get `certificate_preferences.default_visibility`, `auto_approve_verifier`, and `default_access_duration`; universities get `institution_preferences` including `default_certificate_prefix`.

- **Batch certificate issuance via CSV upload.** Universities can issue multiple certificates at once via `POST /university/certificates/batch`. A sample CSV template is available at `GET /university/certificates/batch-template`.

- **Withdrawal request flow.** Students can submit a withdrawal request with a reason (`POST /student/withdrawal/request`). Universities review pending requests and approve or reject them. On approval, the enrollment status is set to `withdrawn`.

- **Profile change requests reviewed by admin.** Students can submit requests to change fields that require admin verification (`POST /profile/change-requests`), optionally attaching supporting documents stored as a JSON array of file paths. Admins review, approve, or reject these requests with notes.

---

## Roles

| Role | What they can do |
| :--- | :--- |
| **Admin** | Approves or rejects new university and verifier registrations, suspends and unsuspends accounts, revokes or restores any certificate, reviews profile change requests with supporting documents, and views system-wide activity logs and analytics. |
| **University** | Manages their own departments, majors, and certificate levels; enrolls students directly or by approving student-submitted enrollment applications; issues individual and batch certificates; processes extension requests, withdrawal requests, and program change requests; and can revoke or unrevoke their own certificates. |
| **Student** | Views and downloads their own certificates, toggles per-certificate public visibility, approves or rejects verifier access requests, revokes active access grants, submits enrollment applications and withdrawal or extension requests, and controls privacy settings. |
| **Verifier** | Searches for students by name (subject to privacy settings), requests time-limited access to a student's certificate records, performs certificate verification by serial number, and exports their verification history. |

---

## Tech Stack

### Backend

- **Framework:** Laravel `^11.31` (PHP `^8.2`)
- **Authentication:** Laravel Sanctum `^4.3` — Bearer token authentication, no CSRF on API routes
- **PDF Generation:** barryvdh/laravel-dompdf `^3.1`
- **QR Codes:** simplesoftwareio/simple-qrcode `^4.2`
- **Permissions:** spatie/laravel-permission `^6.25`
- **REPL:** laravel/tinker `^2.9`

### Frontend

- **Framework:** React `^18.3.1`
- **Build Tool:** Vite `^5.4.19`
- **Routing:** react-router-dom `^6.30.1`
- **UI Components:** @headlessui/react `^2.2.4`
- **Icons:** lucide-react `^0.542.0`
- **Styling:** tailwindcss `^3.4.17` (dev dependency)
- **Forms:** react-hook-form `^7.62.0` + @hookform/resolvers `^5.2.1` + yup `^1.7.0`
- **Charts:** recharts `^3.8.1`
- **HTTP:** axios `^1.11.0`
- **Dropdowns:** react-select `^5.10.2`
- **File Upload:** react-dropzone `^15.0.0`
- **Toasts:** react-hot-toast `^2.6.0`
- **QR Code Display:** qrcode.react `^4.2.0`
- **Client-side PDF:** html2pdf.js `^0.14.0`
- **Utilities:** lodash `^4.18.1`

### Database

- MySQL 8.0
- Schema is managed via `database/schema.sql` (no Laravel migrations). Seed data is in `database/seed.sql`.

---

## Prerequisites

### Windows

The easiest way to get PHP and MySQL on Windows is [XAMPP](https://www.apachefriends.org/) or [Laragon](https://laragon.org/). After installation, make sure PHP is on your system `PATH` so that `php -v` works in any terminal window.

| Software | Minimum version |
| :--- | :--- |
| PHP | 8.2 (with extensions: `mbstring`, `openssl`, `pdo`, `pdo_mysql`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `gd`) |
| Composer | latest |
| Node.js | LTS (18+) |
| npm | included with Node.js |
| MySQL | 8.0 |
| Git | any recent version |

### Linux / macOS

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install php8.2 php8.2-mbstring php8.2-xml php8.2-pdo php8.2-mysql \
    php8.2-tokenizer php8.2-bcmath php8.2-gd php8.2-curl \
    composer mysql-server git

# Install Node.js via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts

# macOS (Homebrew)
brew install php composer mysql node git
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/litch07/eduauth-registry.git
cd eduauth-registry
```

### 2. Database setup

**Windows (MySQL CLI):**

```sql
CREATE DATABASE eduauth_registry;
USE eduauth_registry;
SOURCE /full/path/to/database/schema.sql;
SOURCE /full/path/to/database/seed.sql;
```

Or use phpMyAdmin: create a database named `eduauth_registry`, then import `database/schema.sql` followed by `database/seed.sql`.

**Linux / macOS:**

```bash
mysql -u root -p -e "CREATE DATABASE eduauth_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p eduauth_registry < database/schema.sql
mysql -u root -p eduauth_registry < database/seed.sql
```

### 3. Backend setup

```bash
cd backend

# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

Open `.env` and fill in every variable that is blank or needs to match your local environment:

| Variable | Value to set |
| :--- | :--- |
| `APP_KEY` | Leave blank — generated by `php artisan key:generate` |
| `APP_URL` | `http://localhost:8000` |
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3306` |
| `DB_DATABASE` | `eduauth_registry` |
| `DB_USERNAME` | `root` (or your MySQL user) |
| `DB_PASSWORD` | your MySQL password |
| `MAIL_HOST` | `smtp.gmail.com` (or your SMTP host) |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | your email address |
| `MAIL_PASSWORD` | your SMTP app password |
| `MAIL_FROM_ADDRESS` | `noreply@eduauth.com` (or any valid address) |
| `FRONTEND_URL` | `http://localhost:5173` |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:5173` |

```bash
composer install
php artisan key:generate
php artisan storage:link
php artisan serve
```

The backend API runs at `http://localhost:8000`.

> Background jobs (email sending, PDF queuing) use the `database` queue driver by default. In a separate terminal you can run `php artisan queue:listen --tries=1` to process them. Without a running worker, queued emails will not be sent but the application will otherwise function.

### 4. Frontend setup

Open a second terminal window:

```bash
cd frontend

# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

The only variable in `frontend/.env.example` is:

| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `http://localhost:8000/api` |

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 5. Test accounts

These accounts are created by `database/seed.sql`:

| Role | Email | Password | Status |
| :--- | :--- | :--- | :--- |
| Admin | `eduauthregistry@gmail.com` | `admin123` | Active |
| University | `admin@uiu.ac.bd` | `password123` | Active |
| Student | `ssadidahmed01@gmail.com` | `password123` | Active |
| Student | `sayem23cse@gmail.com` | `password123` | Active |
| Student | `mnur223442@bscse.uiu.ac.bd` | `password123` | Active |
| Student | `kanij.fatema@gmail.com` | `password123` | Active |
| Student | `safwan.al.sajid@gmail.com` | `password123` | Active |
| Student | `pending.student@gmail.com` | `password123` | Pending Approval |
| Verifier | `demo@enosis.com` | `password123` | Active |
| Verifier | `demo@brainstation-23.com` | `password123` | Active |
| Verifier | `ssadidahmed07@gmail.com` | `password123` | Active |

---

## Project Structure

```
eduauth-registry/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Admin/         # Admin-only controllers (UserController, ActivityLogController, AnalyticsController, AdminCertificateController, AdminProfileChangeRequestController)
│   │   │   │   ├── Auth/          # Registration, login, email verification, password reset
│   │   │   │   ├── Student/       # Student dashboard, certificates, access requests, withdrawal, extension, enrollment applications, program changes
│   │   │   │   ├── University/    # University dashboard, enrollments, certificates, departments, majors, certificate levels, withdrawal and extension handling
│   │   │   │   ├── Verifier/      # Certificate verification, student search, access request submission
│   │   │   │   ├── CertificateController.php   # Shared certificate revoke/download used by multiple roles
│   │   │   │   ├── ProfileController.php        # Profile view and update, email change, password change
│   │   │   │   ├── ProfileChangeRequestController.php  # Student-facing profile change requests
│   │   │   │   ├── NotificationController.php   # In-app notification read/unread
│   │   │   │   └── SettingsController.php        # User settings read and update
│   │   ├── Models/                # Eloquent models (one per database table)
│   │   └── Services/
│   │       ├── SerialGeneratorService.php   # Certificate serial generation with SELECT FOR UPDATE locking and checksum
│   │       ├── EncryptionService.php        # AES-256-CBC NID encryption/decryption and DOB share-link token
│   │       └── CertificateService.php       # PDF generation orchestration via dompdf
│   ├── resources/
│   │   └── views/
│   │       ├── certificates/      # Blade templates rendered to PDF by dompdf
│   │       └── emails/            # Blade templates for email notifications
│   └── routes/
│       └── api.php                # All API routes, grouped by role middleware
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── admin/             # Admin dashboard, user management, certificate oversight, analytics
│       │   ├── auth/              # Login, register, password reset, email verification pages
│       │   ├── student/           # Student dashboard, certificates, access requests, enrollment applications
│       │   ├── university/        # University dashboard, enrollment management, certificate issuance
│       │   ├── verifier/          # Verifier dashboard, verification tool, student search
│       │   ├── public/            # Public certificate verification page (no login required)
│       │   ├── profile/           # Shared profile and settings pages
│       │   ├── notifications/     # Notification inbox
│       │   └── search/            # Cross-role certificate search
│       ├── components/            # Shared UI components (forms, tables, modals, layout)
│       ├── contexts/
│       │   ├── AuthContext.jsx          # Authenticated user state
│       │   ├── NotificationContext.jsx  # Unread notification count with polling
│       │   └── ThemeContext.jsx         # Light/dark/system theme
│       ├── services/
│       │   ├── api.js             # Axios instance with base URL and auth header injection
│       │   ├── authService.js     # Login, logout, register API calls
│       │   └── certificateService.js    # Certificate fetch and download helpers
│       └── utils/                 # Date formatting, validation helpers
│
└── database/
    ├── schema.sql                 # Full table definitions (CREATE TABLE statements, no Laravel migrations)
    └── seed.sql                   # Test accounts and sample data
```

---

## Key Technical Decisions

- **`schema.sql` instead of Laravel migrations.** The database schema is managed as a plain SQL file rather than Laravel's migration system. This keeps the schema visible and diff-able in one file and avoids migration state tracking across team members' machines. The trade-off is that schema changes require manual SQL and re-importing during development.

- **NID stored as both a hash and an AES ciphertext.** When a student registers, their NID is hashed (stored in `nid_hash`) for uniqueness enforcement and search, and separately encrypted with AES-256-CBC (stored in `nid_encrypted`) so that it can be decrypted and displayed to authorized users. The hash alone cannot be reversed, which is why two columns exist.

- **Certificate serial numbers use database-level locking.** `SerialGeneratorService::generate()` wraps the sequence increment in a `DB::transaction()` with `lockForUpdate()` on the `certificate_sequences` row. This prevents two simultaneous issuances from producing the same serial number. The serial format is `PREFIX-YY-NNNNNNC` where `PREFIX` is the `short_code` from the `CertificateLevel` record and `C` is a checksum character from a 32-character alphanumeric set (excluding `0`, `O`, `I`, `1` to avoid visual ambiguity).

- **Authentication uses Sanctum Bearer tokens, not CSRF cookies.** The API is stateless from the frontend's perspective. After login, the frontend stores the Bearer token and sends it in every request via the `Authorization` header. The `SANCTUM_STATEFUL_DOMAINS` variable in `.env` exists for a potential future SPA cookie-based fallback but is not active in the current API authentication path.

- **Certificate visibility is student-controlled, not university-controlled.** The `is_publicly_shareable` flag on the `certificates` table defaults to `1` (public) at issuance, but students can toggle it per certificate at any time. The public verification endpoint checks this flag before returning certificate details.

- **Revocation is tracked per-actor.** The `revoked_by_role` column on `certificates` records whether a revocation was performed by `university` or `admin`. This determines which parties can unrevoke: a university can only unrevoke certificates they revoked themselves; admins can restore any revocation. Every revocation and restoration appends a full audit entry to the `revocation_history` JSON column.

- **Verifier access is time-limited and student-revocable.** When a student approves an access request, a `verifier_access` record is created with a `granted_at` and `expires_at` calculated from the request's `access_duration_days`. The `VerifierAccess::isActive()` method checks both the expiry and the `revoked_at` timestamp. Students can revoke access before it expires.

---

## API Reference

Full API documentation is in [API.md](./API.md).
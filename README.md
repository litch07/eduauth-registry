# EduAuth Registry

A university certificate issuance and verification system. Universities issue digital certificates, students manage visibility, verifiers check authenticity, and admins review account registrations — all through a single platform.

## Features

- **Authentication with email verification** — Registration requires a 6-digit SMTP verification code before account creation
- **Admin approval workflow** — New accounts require admin review before access is granted
- **Role-based access** — Four distinct roles: Student, University, Verifier, Admin
- **Certificate issuance** — Universities issue certificates with auto-generated serial numbers
- **Student-controlled visibility** — Students toggle their certificates between public and private
- **Public verification** — Anyone can verify a public certificate using its serial number and the student's date of birth
- **Activity logging** — All significant actions are logged for auditing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 11, PHP 8.2, Laravel Sanctum |
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| Database | MySQL 8 |
| Email | SMTP (configurable — Gmail, Mailtrap, etc.) |
| Tooling | Composer, npm |

## Project Structure

```
eduauth-registry/
├── backend/          # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/   # Auth, Admin, Student, University, Verifier
│   │   ├── Http/Middleware/     # CheckRole middleware
│   │   ├── Mail/               # Verification, approval, rejection emails
│   │   └── Models/             # User, Student, Institution, Certificate, etc.
│   ├── routes/api.php          # All API route definitions
│   └── .env.example            # Environment variable template
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/         # Shared UI components (Button, Card, Input, etc.)
│   │   ├── pages/              # Page components grouped by role
│   │   ├── contexts/           # Auth and Theme providers
│   │   └── services/           # API client (Axios)
│   └── .env.example            # Frontend env template
└── database/         # SQL schema and seed data
    └── eduauth_registry.sql
```

## Prerequisites

- **PHP 8.2+** — `php -v`
- **Composer** — `composer --version`
- **Node.js 18+** — `node -v`
- **npm** — `npm -v`
- **MySQL 8** (or XAMPP with MySQL) — `mysql --version`

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/litch07/eduauth-registry.git
cd eduauth-registry
```

### 2. Database setup

1. Start MySQL (or XAMPP).
2. Create a database named `eduauth_registry`.
3. Import the seed data:

```sql
-- Via MySQL CLI
mysql -u root -p eduauth_registry < database/eduauth_registry.sql

-- Or import via phpMyAdmin / MySQL Workbench
```

### 3. Backend setup

```bash
cd backend
composer install
```

Copy the environment file and generate a key:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
php artisan key:generate
```

**macOS / Linux:**
```bash
cp .env.example .env
php artisan key:generate
```

Then configure your `.env` — see the [Environment Variables](#environment-variables) section below.

Start the backend:
```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### 4. Frontend setup

```bash
cd frontend
npm install
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

The default `VITE_API_URL` points to `http://localhost:8000/api` — no changes needed for local development.

Start the frontend:
```bash
npm run dev
```

### 5. Open the app

Visit `http://localhost:5173` in your browser.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_URL` | Backend base URL | `http://localhost:8000` |
| `APP_ENV` | Environment mode | `local` |
| `APP_DEBUG` | Show debug info | `true` |
| `DB_CONNECTION` | Database driver | `mysql` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `3306` |
| `DB_DATABASE` | Database name | `eduauth_registry` |
| `DB_USERNAME` | Database user | `root` |
| `DB_PASSWORD` | Database password | _(empty for XAMPP)_ |
| `MAIL_MAILER` | Mail transport | `smtp` |
| `MAIL_HOST` | SMTP server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | SMTP email/user | `your-email@gmail.com` |
| `MAIL_PASSWORD` | SMTP password/app password | `your-app-password` |
| `MAIL_ENCRYPTION` | Encryption type | `tls` |
| `MAIL_FROM_ADDRESS` | Sender email | `noreply@eduauth.com` |
| `MAIL_FROM_NAME` | Sender display name | `EduAuth Registry` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:5173` |
| `SANCTUM_STATEFUL_DOMAINS` | Allowed SPA domains | `localhost:5173` |

#### SMTP setup for Gmail

1. Enable **2-Step Verification** on your Google account.
2. Generate an **App Password** at https://myaccount.google.com/apppasswords.
3. Set these values in `backend/.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="EduAuth Registry"
```

> **Note:** If `MAIL_MAILER` is set to `log` (the default in `.env.example`), verification codes are written to `storage/logs/laravel.log` instead of being emailed. This is useful for local development without SMTP.

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` |

## Usage Flow

### Registration → Verification → Approval → Login

```
1. Register        →  Fill out role-specific form (student/university/verifier)
2. Email verify    →  Enter the 6-digit code sent to your email (expires in 10 min)
3. Await approval  →  Admin reviews and approves your account
4. Login           →  Sign in with your email and password
```

### By role

**Student**
- View issued certificates on the dashboard
- Toggle certificates between public and private
- Private certificates cannot be verified by anyone

**University**
- Issue certificates to enrolled students by student ID
- Serial numbers are generated automatically
- Certificates default to public (students control visibility)

**Verifier**
- Verify certificates using serial number + student's date of birth
- View verification history and stats on the dashboard

**Admin**
- Review and approve/reject pending user registrations
- View system-wide stats (users, certificates, activity)

## Test Credentials

The SQL import includes seeded accounts. All passwords below were set during seeding.

| Role | Email | Password |
|------|-------|----------|
| Admin | `eduauthregistry@gmail.com` | `admin123` |
| University | `admin@uiu.ac.bd` | `password123` |
| Student | `ssadidahmed01@gmail.com` | `password123` |
| Student | `sayem23cse@gmail.com` | `password123` |
| Student | `mnur223442@bscse.uiu.ac.bd` | `password123` |
| Verifier | `demo@enosis.com` | `password123` |
| Verifier | `demo@brainstation-23.com` | `password123` |
| Verifier | `ssadidahmed07@gmail.com` | `password123` |

If a password doesn't work, reset it via tinker:

```bash
php artisan tinker
\App\Models\User::where('email', 'your@email.com')->first()->update(['password' => bcrypt('newpassword')]);
```

## Troubleshooting

**CORS / blocked requests**
- Check that `SANCTUM_STATEFUL_DOMAINS` in `backend/.env` matches your frontend host:port (e.g., `localhost:5173`).

**Authentication issues**
- Axios must use `withCredentials: true` (already configured in `frontend/src/services/api.js`).
- Confirm `APP_URL` is set to `http://localhost:8000` in `backend/.env`.

**Email not sending**
- If using `MAIL_MAILER=log`, codes appear in `backend/storage/logs/laravel.log`.
- For SMTP, verify your credentials and that your email provider allows app passwords.

**Database issues**
- Import `database/eduauth_registry.sql` for seed data.
- Or run `php artisan migrate` for empty tables (no seed data).

**Clear caches**
```bash
php artisan config:clear && php artisan cache:clear && php artisan route:clear
```

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the full endpoint reference.

## Team PhaseShift

- Sadid Ahmed - Backend development, authentication, approval logic, middleware, and certificate workflows
- Md. Assaduzzaman Nur - Frontend development, forms, dashboards, and UI integration
- M.M. Sayem Prodhan - Database design, documentation, testing, and repository coordination

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

Copyright (c) 2025 Sadid Ahmed, Md. Assaduzzaman Nur, and M.M. Sayem Prodhan

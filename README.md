# EduAuth Registry

EduAuth Registry is a university certificate issuance and verification system. It is designed to support secure student records, controlled certificate sharing, role-based access, admin approval, and public certificate verification.

## Overview

This repository contains a full-stack application with a Laravel backend, a React frontend, and a MySQL database. The system is built to let universities issue certificates, students manage and view their records, verifiers confirm authenticity, and administrators review and approve accounts.

## Features

- Role-based access for students, universities, verifiers, and administrators
- Email verification and admin approval for new accounts
- Certificate issuance, listing, and tracking
- Public certificate verification using serial number and date of birth
- Secure access control for private certificate views
- Administrative approval and review workflow
- MySQL-backed data storage with audit-friendly records

## Tech Stack

- Backend: Laravel 11, PHP 8.2, Laravel Sanctum, Spatie Permission
- Frontend: React 18, Vite, React Router
- Styling: Tailwind CSS
- Database: MySQL 8
- Tooling: Composer, npm

## Repository Structure

- `backend/` - Laravel application and server-side logic
- `frontend/` - React application and user interface
- `database/` - SQL schema and database setup files

## Prerequisites

Before you begin, make sure these tools are installed:

- PHP 8.2 or later
- Composer
- Node.js 18 or later
- npm
- MySQL 8 or XAMPP with MySQL

## Clone The Repository

```powershell
git clone https://github.com/litch07/eduauth-registry.git
cd eduauth-registry
```

## Database Setup

1. Start MySQL or XAMPP.
2. Create a database named `eduauth_registry`.
3. Import `database/eduauth_registry.sql` into that database.
4. If needed, adjust your local database credentials in the backend environment file.

If you are using XAMPP, the default local MySQL settings usually work unless your machine is configured differently.

The SQL file already includes the starter data for local use, so there is no separate seed command required.

## Backend Setup

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
```

After creating the backend `.env` file, update these values to match your local database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eduauth_registry
DB_USERNAME=root
DB_PASSWORD=
```

To start the backend during development:

```powershell
php artisan serve
```

You can also use the Laravel development workflow if you want the server and related services together:

```powershell
composer run dev
```

## Frontend Setup

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

After creating the frontend `.env` file, make sure `VITE_API_URL` points to your backend API:

```env
VITE_API_URL=http://localhost:8000/api
```

The frontend uses `VITE_API_URL` to connect to the backend.

To create a production build:

```powershell
npm run build
```

## Run The System

1. Start MySQL and confirm the database import is complete.
2. Start the backend in the `backend/` folder.
3. Start the frontend in the `frontend/` folder.
4. Open the frontend in your browser and sign in or register a new account.

## Using The Platform

This section describes how to use the system and includes test credentials for a quick demo.

### Default Test Credentials

The SQL import (`database/eduauth_registry.sql`) includes seeded accounts for testing. Use the emails below with the password `password` (local seed default). If a seeded password does not work, see the Troubleshooting section for how to reset a user's password.

- Admin: `eduauthregistry@gmail.com` — password: `password`
- University: `admin@uiu.ac.bd` — password: `password`
- Students:
	- `ssadidahmed01@gmail.com` — password: `password`
	- `sayem23cse@gmail.com` — password: `password`
	- `mnur223442@bscse.uiu.ac.bd` — password: `password`
- Verifiers:
	- `demo@enosis.com` — password: `password`
	- `demo@brainstation-23.com` — password: `password`
	- `ssadidahmed07@gmail.com` — password: `password`

If a password doesn't work, reset it using the tinker command in the Troubleshooting section.

### Quick Walkthrough (by role)

- Student
	1. Sign in or register as a Student. After registration, verify your email via the code sent to your inbox.
	2. Wait for admin approval if the account is pending.
	3. Visit `My Certificates` to view issued certificates.
	4. Use `View PDF` to inspect the certificate or `Download` to save the PDF.

- University
	1. Sign in with a university account.
	2. Use `Issue Certificate` to assign a certificate to an enrolled student; the system will generate a serial and a PDF automatically.
	3. Use revoke/restore actions when required; provide a reason to keep an audit trail.

- Verifier
	1. Use the public `/verify` page for instant checks of public certificates (serial + DOB).
	2. As a logged-in verifier, you can keep a history of verifications and request access to private certificates.

- Admin
	1. Review `Pending User Registrations` on the admin dashboard.
	2. Approve or reject accounts with a reason; approvals trigger email notifications.
	3. Manage certificates and review activity logs for auditing.

## Troubleshooting

Common issues when running the Laravel backend and React frontend with Sanctum and how to resolve them:

- CORS and blocked requests
	- Ensure `backend/config/cors.php` includes `sanctum/csrf-cookie` in `paths` and allows the frontend origin.
	- In `backend/.env` set `SANCTUM_STATEFUL_DOMAINS=localhost:5173` (or the host:port your frontend runs on).

- Sanctum authentication problems
	- The SPA flow requires an initial request to `GET /sanctum/csrf-cookie` before login when using cookie-based auth.
	- Axios must be configured with `withCredentials: true` (see `frontend/src/services/api.js`).
	- Confirm `SESSION_DOMAIN` and `SANCTUM_STATEFUL_DOMAINS` are correct for your environment.

- APP_URL and redirect mismatches
	- Set `APP_URL` in `backend/.env` to the URL where your backend runs (e.g. `http://localhost:8000`).

- Database / migrations / seed data
	- This project includes `database/eduauth_registry.sql` with starter data. Import that SQL file if you want the seeded demo accounts.
	- If you prefer, configure `.env` and run `php artisan migrate` to create tables from migrations.

- Common commands
	- Clear caches: `php artisan config:clear && php artisan cache:clear && php artisan route:clear`
	- Regenerate key: `php artisan key:generate`
	- Reset a user password via tinker:

```powershell
php artisan tinker
\App\Models\User::where('email', 'eduauthregistry@gmail.com')->first()->update(['password' => bcrypt('newpassword')]);
```

If you still run into issues, check `storage/logs/laravel.log` for errors and the browser DevTools network tab for failed requests.

## API Documentation

See `API_DOCUMENTATION.md` for a concise list of API endpoints, grouped by role and purpose.

## Team PhaseShift

- Sadid Ahmed - Backend development, authentication, approval logic, middleware, and certificate workflows
- Md. Assaduzzaman Nur - Frontend development, forms, dashboards, and UI integration
- M.M. Sayem Prodhan - Database design, documentation, testing, and repository coordination

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

Copyright (c) 2025 Sadid Ahmed, Md. Assaduzzaman Nur, and M.M. Sayem Prodhan

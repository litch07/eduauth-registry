# EduAuth Registry

A secure, role-based academic credential management platform connecting Students, Universities, Verifiers, and Administrators.

---

## ✨ Features

**Student** — View & download certificates (PDF + QR), toggle visibility, manage verifier access requests, submit profile change requests, request enrollment withdrawal.

**University** — Enroll students, manage enrollment statuses, issue individual or batch certificates via CSV, revoke certificates.

**Verifier** — Search students by exact identifier (email / student ID / NID), send access requests, verify certificates (attempts are logged), export verification history.

**Admin** — Approve/reject user accounts, review profile change requests, revoke certificates system-wide, view analytics with trend charts, global search across users and certificates.

**Shared** — In-app notifications, per-user settings (certificate visibility, notification preferences), encrypted share links for public certificate verification.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Backend | Laravel 11, PHP 8.2+, Laravel Sanctum |
| Database | MySQL 8.0+ |
| PDF | DomPDF (`barryvdh/laravel-dompdf`) |
| Mail | SMTP (configured in `.env`) |

---

## 🔑 Demo Accounts

All demo accounts use the password `password123` except the admin.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `eduauthregistry@gmail.com` | `admin123` |
| **University** | `admin@uiu.ac.bd` | `password123` |
| **Student** (active, has certificates) | `ssadidahmed01@gmail.com` | `password123` |
| **Student** (graduated) | `sayem23cse@gmail.com` | `password123` |
| **Student** (suspended) | `mnur223442@bscse.uiu.ac.bd` | `password123` |
| **Verifier** | `demo@enosis.com` | `password123` |
| **Verifier** | `demo@brainstation-23.com` | `password123` |

---

## 🚀 Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/litch07/eduauth-registry.git
cd eduauth-registry
```

### 2. Prerequisites

| Requirement | Windows | Linux |
|------------|---------|-------|
| PHP 8.2+ | [XAMPP](https://apachefriends.org) or [Laragon](https://laragon.org) | `apt install php8.2` |
| MySQL 8.0+ | Included with XAMPP/Laragon | `apt install mysql-server` |
| Composer | [getcomposer.org](https://getcomposer.org/download/) | `curl -sS https://getcomposer.org/installer \| php` |
| Node.js 18+ | [nodejs.org](https://nodejs.org) | `apt install nodejs` |

---

### 3. Setup (Windows)

**1. Database** — Start MySQL via XAMPP/Laragon, open phpMyAdmin, create a database named `eduauth_registry`, then import `database/schema.sql` followed by `database/seed.sql`.

**2. Backend**
```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```
Set your DB credentials in `backend/.env`, then:
```powershell
php artisan serve
```
> API available at `http://127.0.0.1:8000`

**3. Frontend** — Open a second terminal:
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```
> App available at `http://localhost:5173`

---

### 4. Setup (Linux — Ubuntu / Debian)

**1. Install dependencies**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y && sudo apt update
sudo apt install -y php8.2 php8.2-cli php8.2-mysql php8.2-zip \
  php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath
sudo apt install mysql-server -y
curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**2. Database**
```bash
sudo mysql -u root -e "CREATE DATABASE eduauth_registry;"
mysql -u root eduauth_registry < database/schema.sql
mysql -u root eduauth_registry < database/seed.sql
```

**3. Backend**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Edit .env with your DB credentials
php artisan serve
```

**4. Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 📁 Project Structure

```
eduauth-registry/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/   # Organized by role (Admin, Student, University, Verifier)
│   │   ├── Models/
│   │   ├── Mail/
│   │   ├── Notifications/
│   │   └── Services/
│   └── routes/
│       └── api.php             # All API routes
├── frontend/                   # React + Vite SPA
│   └── src/
│       ├── pages/              # Organized by role
│       ├── components/         # Shared UI components
│       ├── contexts/           # Auth, Theme, Notification contexts
│       ├── services/           # Axios API client
│       └── hooks/              # Custom React hooks
├── database/
│   ├── schema.sql              # Full DB schema (run first)
│   └── seed.sql                # Demo data (run second)
├── API.md                      # API reference
└── README.md
```

---

## ⚠️ Key Constraints

- **Student search** (for verifiers and universities) uses exact identifiers only — email, student ID, or NID. Name-based search is intentionally disabled for privacy.
- **Certificate serial format:** `BSC-YY-SEQSEQ` (e.g., `BSC-26-000001`). Prefix reflects certificate level.
- **Enrollment rule:** One active enrollment per student per institution at a time.
- **Private certificates** are only visible to verifiers with an approved, non-expired access grant.
- **Timezone:** Set `APP_TIMEZONE` in `backend/.env` to match your local timezone (e.g., `Asia/Dhaka`) for correct date handling.

---

## 👥 Development Team

Developed by **Team PhaseShift**:

- **Sadid Ahmed** — Lead Backend Developer & Architect
- **Md. Assaduzzaman Nur** — Lead Frontend & UI/UX Developer
- **M.M. Sayem Prodhan** — Full-Stack Engineer & Database Architect

---

## 📄 License

Licensed under the [MIT License](LICENSE).

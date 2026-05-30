# 🎓 EduAuth Registry

![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=flat-square&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)

**EduAuth Registry** is a comprehensive web application designed for Bangladeshi universities to issue, manage, and verify academic certificates digitally. It provides a secure platform where institutions can grant credentials, students can control access to their academic records, and third-party organizations can reliably verify them.

---

## ✨ Features

- **🛡️ Secure Verification:** Verifiers can validate certificates using unique serial numbers and the student's date of birth.
- **🎓 University Management:** Universities can enroll students, issue digital certificates with CGPAs, and process enrollment/withdrawal applications.
- **🔒 Student Privacy:** Students have full control over their profile visibility (public, private, or verifier-only).
- **🤝 Access Control:** Students review pending access requests and can grant temporary access to verifiers.
- **📑 Audit Trails:** The system automatically logs all verification attempts and critical actions for auditing purposes.
- **⚙️ Administrative Control:** Admins review and approve new account registrations, revoke certificates if errors are found, and monitor system activity.

## 👥 Roles & Permissions

| Role | Capabilities |
| :--- | :--- |
| **Admin** | Approves user registrations, revokes certificates, and monitors overall system activity. |
| **University** | Enrolls students, issues academic certificates, and processes withdrawal or enrollment applications. |
| **Student** | Manages certificate visibility, approves verifier access requests, and downloads digital certificates. |
| **Verifier** | Requests access to student records and verifies certificate authenticity for employment or background checks. |

## 🛠️ Tech Stack

### Backend
- **Framework:** Laravel ^11.31 (PHP ^8.2)
- **Auth:** Laravel Sanctum
- **Packages:** `dompdf`, `spatie/laravel-permission`

### Frontend
- **Framework:** React ^18.3.1 (Vite)
- **Styling:** Tailwind CSS
- **Libraries:** React Router DOM, React Hook Form, Recharts

### Database
- **RDBMS:** MySQL 8.0

---

## 🚀 Getting Started

### Prerequisites

**For Windows:**
- **PHP** (8.2 or higher) with extensions: `mbstring`, `openssl`, `pdo`, `pdo_mysql`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `gd`
- **Composer** (latest)
- **Node.js** (LTS) & **npm**
- **MySQL** (8.0)
- **Git**
> *Tip: Use [XAMPP](https://www.apachefriends.org/) or [Laragon](https://laragon.org/) as an easy way to get PHP and MySQL together. We recommend using **Git Bash** or **PowerShell** for running setup commands.*

**For Linux / Mac:**
- **PHP** (8.2 or higher) with the extensions listed above.
- **Composer** (latest)
- **Node.js** (LTS) & **npm**
- **MySQL** (8.0)
- **Git**
> *Tip: Use `apt` (Ubuntu/Debian) or `brew` (Mac) for installing PHP and MySQL. Ensure `php-cli` and `php-fpm` are installed.*

---

### Installation & Setup

We have split the installation guides depending on your operating system to ensure a smooth setup experience for any visitor.

<details open>
<summary><strong>🪟 Windows Setup Guide</strong> (Click to collapse/expand)</summary>

<br>

**1. Clone the repository**
```bash
git clone https://github.com/litch07/eduauth-registry.git
cd eduauth-registry
```

**2. Database Setup**
Open MySQL (via XAMPP phpMyAdmin, MySQL Workbench, or the MySQL CLI). Create a new database named `eduauth_registry` and import the provided SQL files.

Alternatively, via terminal:
```bash
mysql -u root -p
```
```sql
CREATE DATABASE eduauth_registry;
USE eduauth_registry;
SOURCE database/schema.sql;
SOURCE database/seed.sql;
exit;
```

**3. Backend Setup**
```bash
cd backend
copy .env.example .env
```
Update your `.env` file:
```env
APP_URL=http://localhost:8000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eduauth_registry
DB_USERNAME=root
DB_PASSWORD=
```
Install dependencies and start the server:
```bash
composer install
php artisan key:generate
php artisan serve
```
*The backend API will run at `http://localhost:8000`.*

**4. Frontend Setup**
Open a new terminal window:
```bash
cd frontend
copy .env.example .env
```
Update your `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
```
Install dependencies and start the app:
```bash
npm install
npm run dev
```
*The frontend will run at `http://localhost:5173`.*

</details>

<details>
<summary><strong>🐧🍎 Linux / Mac Setup Guide</strong> (Click to collapse/expand)</summary>

<br>

**1. Clone the repository**
```bash
git clone https://github.com/litch07/eduauth-registry.git
cd eduauth-registry
```

**2. Database Setup**
If MySQL is not installed, install it using `sudo apt install mysql-server` (Ubuntu) or `brew install mysql` (Mac). Set up the database via the terminal:
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE eduauth_registry;
USE eduauth_registry;
SOURCE database/schema.sql;
SOURCE database/seed.sql;
exit;
```

**3. Backend Setup**
```bash
cd backend
cp .env.example .env
```
Update your `.env` file:
```env
APP_URL=http://localhost:8000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eduauth_registry
DB_USERNAME=root
DB_PASSWORD=
```
Install dependencies and start the server:
```bash
composer install
```
*(If `composer install` fails, verify PHP extensions from the Prerequisites are enabled in `php.ini`)*
```bash
php artisan key:generate
php artisan serve
```
*The backend API will run at `http://localhost:8000`.*

**4. Frontend Setup**
Open a new terminal window:
```bash
cd frontend
cp .env.example .env
```
Update your `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
```
Install dependencies and start the app:
```bash
npm install
npm run dev
```
*The frontend will run at `http://localhost:5173`.*

</details>

---

## 🧪 Test Accounts

Use the following credentials to explore the system's different roles after setup:

| Role | Email Address | Password | Status |
| :--- | :--- | :--- | :--- |
| **Admin** | `eduauthregistry@gmail.com` | `admin123` | Active |
| **University** | `admin@uiu.ac.bd` | `password123` | Active |
| **Student** | `ssadidahmed01@gmail.com` | `password123` | Active |
| **Student** | `sayem23cse@gmail.com` | `password123` | Active |
| **Student** | `mnur223442@bscse.uiu.ac.bd` | `password123` | Active |
| **Student** | `kanij.fatema@gmail.com` | `password123` | Active |
| **Student** | `safwan.al.sajid@gmail.com` | `password123` | Active |
| **Student** | `pending.student@gmail.com` | `password123` | Pending Approval |
| **Verifier** | `demo@enosis.com` | `password123` | Active |
| **Verifier** | `demo@brainstation-23.com` | `password123` | Active |
| **Verifier** | `ssadidahmed07@gmail.com` | `password123` | Active |

---

## 📁 Project Structure

```text
eduauth-registry/
├── backend/                  # Laravel backend application
│   ├── app/Http/Controllers/ # Controllers organized by role (Admin, Student, etc.)
│   ├── app/Models/           # Eloquent models
│   ├── app/Services/         # Business logic services
│   └── resources/views/      # Email and PDF templates
├── frontend/                 # React frontend application
│   ├── src/pages/            # Role-based page components
│   ├── src/components/       # Shared UI components
│   └── src/contexts/         # Global state (auth, notifications, theme)
└── database/                 # Database structure and seed data
    ├── schema.sql
    └── seed.sql
```

## 📖 API Reference

Comprehensive API documentation is available in [`API.md`](./API.md).

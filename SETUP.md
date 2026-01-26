# Setup Guide - EduAuth Registry

## Prerequisites

- **Node.js** 16+ and npm
- **MySQL 8.0**
- **Git**

## Step-by-Step Installation

### 1. Clone Repository

```bash
git clone https://github.com/sadid-ahmed-007/eduauth-update-v1.git
cd eduauth-update-v1
```

### 2. Database Setup

#### Option A: MySQL Command Line

```bash
mysql -u root -p < database/schema.sql
```

When prompted, enter your MySQL root password.

#### Option B: MySQL Workbench / phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Create a new database named `eduauth_registry`
3. Open `database/schema.sql`
4. Execute all queries

**Verify tables were created:**

```bash
mysql -u root -p -e "USE eduauth_registry; SHOW TABLES;"
```

You should see: Users, Student, Institution, Enrollment, Certificate, CertificateSequence

### 3. Seed Demo Data (Optional)

This creates a test university (UIU) with demo students:

```bash
cd backend
npm install
node seed-demo.js
```

Output should show:
```
✓ University created: Islamic University of Technology
✓ Students enrolled successfully
```

### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# Example .env:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=eduauth_registry
# JWT_SECRET=your_super_secret_key_change_in_production
# FRONTEND_URL=http://localhost:3000
# NODE_ENV=development
# PORT=5000
```

### Start Backend Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:5000
Database connected successfully
```

**Leave this terminal running.**

### 5. Frontend Setup

Open a **new terminal** in the project root:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Automatic browser should open: http://localhost:3000

---

## Test the Application

### 1. Login with Demo University Account

- **Email:** `demo@uiu.ac.bd`
- **Password:** `password123`

### 2. Issue a Certificate

1. Go to **Dashboard** → **Issue Certificate**
2. Search for student (e.g., "2021")
3. Select from results (keyboard: arrow keys + Enter, or click)
4. Fill in certificate details
5. Click **Issue Certificate**
6. Serial number displays on success

### 3. View Enrolled Students

1. From **Dashboard** → **View All Students**
2. Use search box to filter
3. Sort by: Roll, Name, or Email (Asc/Desc)

### 4. Student Account

Login as student:
- **Email:** `ssadidahmed07@gmail.com`
- **Password:** `password123`

Or use one of the other demo students:
- `sayem23cse@gmail.com` / `password123`
- `mhossain2330996@bscse.uiu.ac.bd` / `password123`

View dashboard and enrollments.

---

## Troubleshooting

### "Failed to connect to MySQL"

**Problem:** Backend cannot connect to database

**Solution:**
1. Verify MySQL is running
2. Check `.env` file:
   - `DB_HOST=localhost` (or your server IP)
   - `DB_USER` and `DB_PASSWORD` match MySQL credentials
   - `DB_NAME=eduauth_registry`
3. Verify database was created:
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```
4. Verify schema was imported:
   ```bash
   mysql -u root -p -e "USE eduauth_registry; SHOW TABLES;"
   ```

### "Port 5000 already in use"

**Solution:**
```bash
# Change PORT in .env to 5001 or another free port
# Also update FRONTEND_URL if needed
```

### "Port 3000 already in use"

**Solution:**
```bash
# Windows PowerShell:
$env:PORT=3001; npm start

# macOS/Linux:
PORT=3001 npm start
```

### "npm: command not found"

**Solution:** Install Node.js from https://nodejs.org (includes npm)

### "No enrolled students showing"

**Solution:**
1. Run seed script:
   ```bash
   cd backend
   node seed-demo.js
   ```
2. Verify data was inserted:
   ```bash
   mysql -u root -p -e "USE eduauth_registry; SELECT COUNT(*) FROM Student;"
   ```

### "Certificate search returns no results"

**Solution:**
1. Ensure students are enrolled (run seed)
2. Check spelling of search terms
3. Server-side search requires **at least 2 characters**
4. Results are paginated (20 per page) — click "Load more"

### "Login fails with correct credentials"

**Solution:**
1. Verify user exists in database:
   ```bash
   mysql -u root -p -e "USE eduauth_registry; SELECT email FROM Users;"
   ```
2. Check browser console (F12) for error details
3. Verify JWT_SECRET in `.env` is set
4. Check backend logs for validation errors

### Node Deprecation Warnings on npm start

**Normal behavior:** Messages like `fs.F_OK is deprecated` and `onAfterSetupMiddleware deprecated` are from React Scripts tooling and do not affect functionality. These are informational only.

---

## Environment Variables

### Backend `.env` Template

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eduauth_registry
JWT_SECRET=your_secret_key_here_change_in_production
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

### Frontend `.env` (Pre-configured)

```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Development Commands

### Backend

```bash
# Start dev server with auto-reload
npm run dev

# Run seed script
node seed-demo.js

# Check database
mysql -u root -p
```

### Frontend

```bash
# Start development server
npm start

# Build production
npm run build

# Run tests
npm test
```

---

## File Locations Reference

| Component | Location |
|-----------|----------|
| Database Schema | `database/schema.sql` |
| Backend Routes | `backend/src/routes/` |
| Backend Controllers | `backend/src/controllers/` |
| Frontend Pages | `frontend/src/pages/` |
| API Client | `frontend/src/services/api.js` |
| Auth Middleware | `backend/src/middleware/auth.js` |

---

## Next Steps

1. **Explore the codebase** — Review controllers for business logic
2. **Test edge cases** — Try invalid inputs, large datasets
3. **Review database** — Check normalized schema design
4. **Customize** — Modify seed data, add more features

---

## Support

For issues:
1. Check this guide's Troubleshooting section
2. Review backend logs in terminal
3. Check browser console (F12) for frontend errors
4. Review `.env` configuration
5. Open a GitHub issue with error details

---

**Happy coding! 🚀**

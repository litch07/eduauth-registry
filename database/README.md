# EduAuth Registry Database Setup

Use `schema.sql` and `seed.sql` as the MySQL sources of truth for your database.

---

## 🛠️ Import Instructions for XAMPP / Local MySQL

Follow these steps to set up and seed your database locally:

### 1. Start MySQL
Open your XAMPP Control Panel and start the **MySQL** service (along with **Apache** if you are planning to use phpMyAdmin).

### 2. Create the Database
Create a new database named `eduauth_registry` using your preferred database administration tool (phpMyAdmin, MySQL Command Line, MySQL Workbench, etc.):

* **SQL Command:**
  ```sql
  CREATE DATABASE IF NOT EXISTS eduauth_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

### 3. Import Database Files
You **must** import the schema first to build the table structures, followed by the seed file to populate the demo records.

#### Option A: Using phpMyAdmin (Graphical Interface)
1. Open phpMyAdmin in your browser (`http://localhost/phpmyadmin`).
2. Click on the **`eduauth_registry`** database on the left sidebar.
3. Click the **Import** tab on the top menu.
4. Choose **`schema.sql`** and click **Import** (or **Go**).
5. Once complete, click the **Import** tab again, choose **`seed.sql`**, and click **Import** (or **Go**).

#### Option B: Using the MySQL CLI
Open your terminal (CMD/PowerShell on Windows, Terminal on Linux/macOS) and run:

* **Windows Command Prompt (CMD):**
  ```cmd
  mysql -u root -p eduauth_registry < schema.sql
  mysql -u root -p eduauth_registry < seed.sql
  ```

* **Windows PowerShell:**
  ```powershell
  Get-Content schema.sql | mysql -u root -p eduauth_registry
  Get-Content seed.sql | mysql -u root -p eduauth_registry
  ```

* **Linux / macOS Terminal:**
  ```bash
  mysql -u root -p eduauth_registry < schema.sql
  mysql -u root -p eduauth_registry < seed.sql
  ```

---

## ⚙️ Backend Environment Config

Configure your Laravel backend by setting up the following values in your `backend/.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eduauth_registry
DB_USERNAME=root
DB_PASSWORD=
```

---

## 🧹 Post-Import Cache Cleansing

After importing the database and setting up your environment configuration, run the following Artisan commands in your `backend` directory to clear old cached config states:

```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

> [!TIP]
> If you make any direct database modifications, running `php artisan config:clear` ensures Laravel immediately recognizes the active connections without using outdated cached values.

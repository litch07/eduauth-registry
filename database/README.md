# EduAuth Registry Database

Use `eduauth_registry.sql` as the single MySQL source of truth for XAMPP.

1. Start MySQL in XAMPP.
2. Create or select the `eduauth_registry` database.
3. Import `eduauth_registry.sql` with phpMyAdmin or the MySQL CLI.
4. Use this backend `.env` setup:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eduauth_registry
DB_USERNAME=root
DB_PASSWORD=
```

After import, run `php artisan config:clear`, `php artisan route:clear`, and `php artisan cache:clear`.

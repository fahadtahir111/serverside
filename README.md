# Express Backend for CryptoBot

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the `server/` directory with:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=cryptobot
   JWT_SECRET=your_jwt_secret
   PORT=5000
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   EMAIL_FROM=your@email.com
   ```
3. Create the MySQL database and users table:
   ```sql
   CREATE DATABASE IF NOT EXISTS cryptobot;
   USE cryptobot;
   CREATE TABLE IF NOT EXISTS users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     username VARCHAR(50) NOT NULL,
     email VARCHAR(100) NOT NULL UNIQUE,
     password_hash VARCHAR(255) NOT NULL,
     credits INT DEFAULT 3,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
4. Start the server:
   ```bash
   node index.js
   ```

## API Endpoints
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — Login and get JWT
- `GET /api/credits/` — Get user credits (JWT required)
- `POST /api/credits/use-credit` — Use a credit (JWT required)
- `POST /api/credits/buy` — Buy credits (JWT required, body: { credits, amount })

## Admin Endpoints

- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/users/:id/credits` - Update a user's credits (admin only)
- `GET /api/admin/purchases` - List all credit purchases (admin only)
- `GET /api/admin/revenue` - Get total revenue (admin only)

Admin authentication: Only users with email 'admin@admin.com' (as per demo) can access these endpoints.

## Email Verification Setup

1. The backend will now send a verification code to users on signup. Users must verify their email before logging in. 
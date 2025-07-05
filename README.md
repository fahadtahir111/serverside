# Express Backend for CryptoBot

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the `server/` directory with:
   ```env
   MONGO_URI=mongodb+srv://fahaddb:<db_password>@cluster0.ccyw2do.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
   Replace `<db_password>` with your actual MongoDB password.
3. Start the server:
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
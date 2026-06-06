# Bank Transaction Ledger System

A production-grade banking backend implementing double-entry bookkeeping, atomic transactions, and idempotent payment processing — built with Node.js, Express, and MongoDB.

## Features

- **Double-entry ledger** — every transaction creates paired DEBIT/CREDIT ledger entries atomically, ensuring financial consistency at all times.
- **ACID transactions** — MongoDB sessions guarantee all-or-nothing execution; partial updates are impossible.
- **Idempotency** — unique transaction keys prevent duplicate processing on retries or network failures.
- **Immutable ledger** — schema-level immutability + Mongoose pre-hooks block all modification and deletion of ledger entries, preserving a tamper-proof audit trail.
- **Dynamic balance computation** — account balance is computed via MongoDB aggregation pipeline over ledger entries, never stored as a mutable field — eliminates stale-read issues.
- **JWT authentication** — secure login with token blacklisting on logout via MongoDB TTL index (auto-expires after 3 days).
- **System user role** — separate privileged role for initial fund disbursement, protected by dedicated middleware.
- **Email notifications** — OAuth2-authenticated Gmail notifications (via Nodemailer) on transaction success and failure.

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Runtime      | Node.js, Express.js               |
| Database     | MongoDB, Mongoose                 |
| Auth         | JWT, bcrypt, Token Blacklist      |
| Email        | Nodemailer, Gmail OAuth2          |
| API Style    | REST                              |

## Architecture

```
Client
  │
  ▼
Express Router
  ├── /api/auth        → register, login, logout
  ├── /api/accounts    → create account, get balance
  └── /api/transactions
        ├── POST /              → transfer funds (auth user)
        └── POST /system/initialFund → seed funds (system user only)
                │
                ▼
        MongoDB Session (ACID)
          ├── Create Transaction (PENDING)
          ├── Create Ledger Entry (DEBIT)
          ├── Create Ledger Entry (CREDIT)
          └── Update Transaction (COMPLETED)
                │
                ▼
        Email Notification (OAuth2 Gmail)
```

**Why double-entry bookkeeping?**
Every transfer creates two ledger entries — a DEBIT on the sender's account and a CREDIT on the receiver's. Balance is the sum of all CREDITs minus all DEBITs. This means there is no single mutable "balance" field that can go stale under concurrent writes — the ledger is the source of truth.

## API Reference

### Auth

| Method | Endpoint              | Auth     | Description          |
|--------|-----------------------|----------|----------------------|
| `POST` | `/api/auth/register`  | None     | Register a new user  |
| `POST` | `/api/auth/login`     | None     | Login, returns JWT   |
| `POST` | `/api/auth/logout`    | Required | Blacklist JWT token  |

### Accounts

| Method | Endpoint                            | Auth     | Description             |
|--------|-------------------------------------|----------|-------------------------|
| `POST` | `/api/accounts`                     | Required | Create a new account    |
| `GET`  | `/api/accounts`                     | Required | Get all user accounts   |
| `GET`  | `/api/accounts/balance/:accountId`  | Required | Get account balance     |

### Transactions

| Method | Endpoint                               | Auth        | Description              |
|--------|----------------------------------------|-------------|--------------------------|
| `POST` | `/api/transactions`                    | Required    | Transfer funds           |
| `POST` | `/api/transactions/system/initialFund` | System only | Seed initial funds       |

### Request Bodies

**Register / Login**
```json
{
  "email": "user@example.com",
  "username": "sai",
  "password": "yourpassword"
}
```

**Transfer funds**
```json
{
  "fromAccount": "<accountId>",
  "toAccount": "<accountId>",
  "amount": 500,
  "idempotencyKey": "unique-key-123"
}
```

**Seed initial funds (system user only)**
```json
{
  "toAccount": "<accountId>",
  "amount": 10000,
  "idempotencyKey": "unique-key-456"
}
```

## Running Locally

```bash
# Clone the repo
git clone https://github.com/hisaiii/banking_system
cd banking_system

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Start the server
npm run dev
```

Server runs on `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root:

```env
DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/banking
JWT_SECRET=your_jwt_secret
PORT=3000

# Gmail OAuth2 (for email notifications)
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REFRESH_TOKEN=your_google_refresh_token
EMAIL_USER=your_gmail_address
```

**Setting up Gmail OAuth2:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable Gmail API
3. Create OAuth2 credentials → get `CLIENT_ID` and `CLIENT_SECRET`
4. Use [OAuth Playground](https://developers.google.com/oauthplayground/) to generate `REFRESH_TOKEN`

## Key Technical Decisions

**Why not store balance as a field?**
A mutable `balance` field on the account document is vulnerable to race conditions — two concurrent transactions can both read the same stale balance and both proceed, leading to incorrect totals. Computing balance from the ledger via aggregation is always accurate regardless of concurrency.

**Why idempotency keys?**
If a client sends a transaction request and the network drops before receiving the response, they may retry. Without idempotency, the transaction runs twice. With a unique `idempotencyKey`, the second request returns the already-completed transaction instead of creating a duplicate.

**Why immutable ledger entries?**
Financial audit trails must never be altered. Ledger entries are marked `immutable: true` at the schema level, and Mongoose pre-hooks throw errors on any attempted update or delete — making accidental or malicious modification impossible at the application layer.

**Why JWT blacklisting with TTL index?**
JWTs are stateless — once issued, they're valid until expiry. On logout, we store the token in a blacklist collection with a MongoDB TTL index that auto-deletes entries after 3 days (matching token expiry), keeping the collection lean without manual cleanup.

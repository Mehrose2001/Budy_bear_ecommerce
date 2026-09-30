# Budy Bear API

Separate Express API for catalog, orders, users, reviews, wishlist, coupons, and Hostinger media. PostgreSQL lives in Supabase. Card payments are stubbed until a gateway is provided.

## Setup

1. Create a Supabase project and copy URL + anon + service role keys into `backend/.env` (see `env.example`).
2. In the Supabase SQL editor, run `sql/001_schema.sql`, then `sql/002_rls.sql`, then `sql/003_rpc.sql`.
3. Copy `env.example` to `.env` and fill keys. Do not put Hostinger Gmail / hPanel passwords in git.
4. Create an FTP account in Hostinger hPanel for the 50GB media folder and set `HOSTINGER_FTP_*`. Until FTP is set, uploads are served from this API at `/media`.
5. Install and run:

```bash
cd backend
npm install
npm run bootstrap
npm run seed
npm run dev
```

The storefront reads `NEXT_PUBLIC_API_URL=http://localhost:4000`. If the API or Supabase is down, storefront pages keep serving the in-memory catalog so shoppers are not blocked; admin writes fail instead of silently saving RAM-only data.

## Auth

Admin login is `POST /auth/login` against Supabase Auth. Bootstrap creates `ADMIN_BOOTSTRAP_EMAIL`. Storefront customer login uses the same route; new accounts default to role `customer`.

# Shoukhinabesh Backend

Production-ready NestJS backend for the Shoukhinabesh e-commerce platform.

## Overview

This service provides:

- JWT authentication with access and refresh tokens
- Role-based access control (`CUSTOMER`, `VENDOR`, `ADMIN`)
- Product, category, cart, wishlist, review, coupon, and order management
- Payment integrations (Stripe and SSLCommerz)
- OTP-based email verification and password reset
- Cloudinary image upload support
- Swagger API docs in non-production environments

## Tech Stack

- NestJS 11 (TypeScript)
- Prisma + MongoDB
- Passport JWT
- Nodemailer
- Stripe + SSLCommerz
- Cloudinary

## Project Structure

```text
shoukhinabesh-backend/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ common/
│  │  ├─ decorators/
│  │  ├─ filters/
│  │  ├─ guards/
│  │  └─ interceptors/
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ users/
│  │  ├─ categories/
│  │  ├─ products/
│  │  ├─ cart/
│  │  ├─ orders/
│  │  ├─ payments/
│  │  ├─ reviews/
│  │  ├─ coupons/
│  │  ├─ upload/
│  │  ├─ health/
│  │  ├─ mail/
│  │  └─ wishlist/
│  └─ prisma/
└─ test/
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (local or cloud)

## Environment Variables

Create `.env` in the backend root.

```env
# Core
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
API_BASE_URL=http://localhost:3000

# Auth
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Mail (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=no-reply@yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (optional if using Stripe)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# SSLCommerz (optional if using SSLCommerz)
SSLCZ_STORE_ID=your_store_id
SSLCZ_STORE_PASS=your_store_password
SSLCZ_IS_LIVE=false
```

## Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Push schema to MongoDB:

```bash
npx prisma db push
```

4. (Optional) Seed data:

```bash
npx prisma db seed
```

5. Start development server:

```bash
npm run start:dev
```

Backend runs on `http://localhost:3000` by default with global API prefix `api/v1`.

## API Endpoints

- Base URL: `http://localhost:3000/api/v1`
- Health: `GET /api/v1/health`
- Swagger docs (non-production only): `http://localhost:3000/api/docs`

## Available Scripts

- `npm run start` - Start server
- `npm run start:dev` - Start in watch mode
- `npm run start:debug` - Start with debugger
- `npm run build` - Build to `dist`
- `npm run start:prod` - Run production build
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage

## Docker

Run with Docker Compose:

```bash
docker-compose up --build
```

Services:

- API: `http://localhost:3000`
- Nginx: `http://localhost`

## Notes

- CORS is currently configured in `src/main.ts` for local/Vercel origins. Update allowed origins before deployment if your frontend domain changes.
- Swagger is disabled when `NODE_ENV=production`.

# Universal Inc - Tattoo Artist Directory Platform

TypeScript/Node.js-based tattoo artist directory and booking platform.

## Overview

Universal Inc is a comprehensive platform for tattoo artists and clients, featuring artist profiles, portfolio management, booking capabilities, and payment processing.

## Tech Stack

- **Frontend**: React + Vite, TypeScript
- **Backend**: Express.js, tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe
<<<<<<< HEAD
- **Storage**: AWS S3 (for portfolio images)
=======
- **Storage**: Supabase Storage (S3-compatible)
>>>>>>> 9e39687 (Update README and project configuration: Fix bundler errors, update structure and environment variables)
- **Styling**: Tailwind CSS + shadcn/ui components

## Project Structure

```
tattoo-shops/ (root)
<<<<<<< HEAD
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── server/              # Express backend with tRPC
│   ├── _core/           # Core server utilities
│   ├── db.ts            # Database connection
│   └── routers.ts       # API routers
├── shared/              # Shared types and constants
├── drizzle/             # Database schema and migrations
└── scripts/             # Utility scripts
=======
├── backend/             # Backend Application Code
│   ├── drizzle/         # Database schema and migrations
│   ├── server/          # Express backend with tRPC
│   └── shared/          # Shared types and constants
├── frontend/            # Frontend Application Code
│   └── client/          # React frontend
└── tests/               # Test files
>>>>>>> 9e39687 (Update README and project configuration: Fix bundler errors, update structure and environment variables)
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
pnpm install
```

<<<<<<< HEAD
3. Set up environment variables:
Create a `.env` file with:
```
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=...
STRIPE_SECRET_KEY=...
```

4. Run database migrations:
=======
2. Set up environment variables:
Create a `.env` file with:
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
JWT_SECRET=...
OWNER_OPEN_ID=...
```

3. Run database migrations:
>>>>>>> 9e39687 (Update README and project configuration: Fix bundler errors, update structure and environment variables)
```bash
pnpm db:push
```

### Development

Start the development server:
```bash
pnpm dev
```

<<<<<<< HEAD
This will start both the frontend (Vite) and backend (Express) servers.
=======
This will start the backend server, which also serves the frontend in development mode.
>>>>>>> 9e39687 (Update README and project configuration: Fix bundler errors, update structure and environment variables)

### Building for Production

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## Key Features

- Artist profile management
- Portfolio image uploads
- Client search and discovery
- Booking system
- Payment processing via Stripe
- AI-powered features (Gemini integration)

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
<<<<<<< HEAD
- `pnpm db:push` - Push database schema changes
- `pnpm db:studio` - Open Drizzle Studio
=======
- `pnpm db:push` - Generate and run database migrations

>>>>>>> 9e39687 (Update README and project configuration: Fix bundler errors, update structure and environment variables)

## Additional Documentation

- See `GEMINI.md` for AI integration details
- See `todo.md` for development roadmap

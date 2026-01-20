# Universal Inc - Tattoo Artist Directory Platform

TypeScript/Node.js-based tattoo artist directory and booking platform.

## Overview

Universal Inc is a comprehensive platform for tattoo artists and clients, featuring artist profiles, portfolio management, booking capabilities, and payment processing.

## Tech Stack

- **Frontend**: React + Vite, TypeScript
- **Backend**: Express.js, tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe
- **Storage**: AWS S3 (for portfolio images)
- **Styling**: Tailwind CSS + shadcn/ui components

## Project Structure

```
tattoo-shops/ (root)
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
```bash
pnpm db:push
```

### Development

Start the development server:
```bash
pnpm dev
```

This will start both the frontend (Vite) and backend (Express) servers.

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
- `pnpm db:push` - Push database schema changes
- `pnpm db:studio` - Open Drizzle Studio

## Additional Documentation

- See `GEMINI.md` for AI integration details
- See `todo.md` for development roadmap

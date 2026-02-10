# Universal Inc - Tattoo Artist Directory Platform

TypeScript/Node.js-based tattoo artist directory and booking platform.

## Overview

Universal Inc is a comprehensive platform for tattoo artists and clients, featuring artist profiles, portfolio management, booking capabilities, and payment processing.

## Tech Stack

- **Frontend**: React + Vite, TypeScript
- **Backend**: Express.js, tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe
- **Storage**: Supabase Storage (S3-compatible)
- **Styling**: Tailwind CSS + shadcn/ui components

## Project Structure

```
tattoo-shops/ (root)
├── backend/             # Backend Application Code
│   ├── drizzle/         # Database schema and migrations
│   ├── server/          # Express backend with tRPC
│   └── shared/          # Shared types and constants
├── frontend/            # Frontend Application Code
│   └── client/          # React frontend
└── tests/               # Test files
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
```bash
pnpm db:push
```

### Development

Start the development server:
```bash
pnpm dev
```

This will start the backend server, which also serves the frontend in development mode.

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
- Portfolio image uploads with progress indicators
- Client search and discovery
- Booking system with enhanced error handling
- Payment processing via Stripe
- Client tattoo request board where clients can post requests and artists can bid on them
- AI-powered features (Gemini integration)
- Health check endpoint for monitoring
- Global network connectivity error handling
- SEO-friendly artist profiles with meta tags and structured data
- Automatic sitemap generation script

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm db:push` - Generate and run database migrations


## Additional Documentation

- See `GEMINI.md` for AI integration details
- See `todo.md` for development roadmap

# Tattoo-Shops Monorepo

This repository contains two related projects for tattoo artist discovery and booking:

## Projects

### 1. tattoo-shops/
Python-based tattoo shop data processing and analysis project.

**Tech Stack:**
- Python
- Backend API
- Data processing (CSV files with Louisiana and USA tattoo parlors)
- Testing with pytest

**Key Files:**
- `backend/` - Backend API implementation
- `frontend/` - Frontend application
- `backend_test.py` - Backend tests
- `louisiana_shops.csv` - Louisiana tattoo shops data
- `usa_tattoo_parlors_final.csv` - USA tattoo parlors database

### 2. universal-inc/
TypeScript/Node.js-based tattoo artist directory and booking platform.

**Tech Stack:**
- TypeScript
- React + Vite (Frontend)
- Express.js (Backend)
- PostgreSQL + Drizzle ORM
- tRPC for type-safe APIs
- Stripe for payments
- AWS S3 for image storage

**Key Directories:**
- `client/` - React frontend application
- `server/` - Express backend with tRPC
- `shared/` - Shared types and constants
- `drizzle/` - Database schema and migrations
- `scripts/` - Utility scripts for seeding data

## Getting Started

Each project can be developed independently within its subdirectory. See the respective README files in each project folder for specific setup instructions.

### tattoo-shops
```bash
cd tattoo-shops
# Follow setup instructions for Python project
```

### universal-inc
```bash
cd universal-inc
pnpm install
pnpm dev
```

## Repository Structure

This is a monorepo combining two previously separate projects while preserving their full Git history. Both projects can be maintained and developed independently while sharing a common repository.

## Development

Both projects maintain their own:
- Dependencies
- Build processes
- Testing frameworks
- Deployment configurations

The root `.gitignore` combines patterns from both projects to handle Python and Node.js artifacts appropriately.

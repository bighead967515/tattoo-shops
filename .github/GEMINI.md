Universal Inc. — AI Agent Instructions
This document serves as the primary system prompt and coding standard for the Universal Inc. Tattoo Artist Directory & Booking Platform. All AI-generated code and architectural suggestions must adhere to these rules.

🛠 Tech Stack & Architecture
Frontend: React 19 (Vite), TypeScript, Tailwind CSS 4, shadcn/ui.

Backend: Node.js Express server using tRPC for a 100% type-safe API.

Database: PostgreSQL (Supabase) managed via Drizzle ORM.

Storage: Supabase Storage for portfolios, profile images, and ID verification.

Payments: Stripe SDK (Checkout sessions, Webhooks, and Subscriptions).

Email: Resend for transactional booking and invitation triggers.

📐 Coding & Development Standards
Strict TypeScript: Explicitly type all variables and functions; the use of any is strictly prohibited.

Component Logic: Use functional components with hooks exclusively.

The 150-Line Rule: If a component file exceeds 150 lines, it must be decomposed into smaller, reusable sub-components.

Validation: Use Zod schemas defined in shared/ for cross-stack validation (Frontend, Backend, and Database).

Iconography: Use lucide-react for all UI icons.

State Management: Use TanStack Query (via tRPC) for all server state. Do not use Redux or Zustand for data that exists in the database.

⚡ UI/UX & Performance
Loading States: Implement shadcn/ui Skeleton screens for every asynchronous data-fetching operation.

Image Optimization: Portfolio and profile uploads must be processed (compressed/resized) on the client side or via a worker before hitting Supabase Storage.

Theme: Support both dark and light modes using the custom `ThemeContext` (see `frontend/client/src/contexts/ThemeContext.tsx`). Public API: wrap the app in `<ThemeProvider>`, consume via the `useTheme()` hook which exposes `theme` (`"light"` | `"dark"`), `toggleTheme()`, and `switchable` flag. Preference is persisted to `localStorage` under the key `"theme"` and applied by toggling the `dark` CSS class on `<html>`.

📋 Workflow & Quality Control
Database Migrations: All schema updates must be executed via pnpm db:push (this script runs Drizzle generate + migrate).

File Structure: Adhere to the established backend/, frontend/client/, shared/, and tests/ hierarchy.

Testing Requirement: Any new utility functions or business logic added to shared/ must include a corresponding unit test in the tests/ directory.

Pre-Flight Check: Always suggest running pnpm build locally to verify TypeScript integrity and linting before proposing a merge to main.

Documentation: Prioritize clear, descriptive naming over inline comments.

Maintain TODO.md as the source of truth for project priorities.

Update API_KEYS_CHECKLIST.md whenever a new environment variable or service is introduced.

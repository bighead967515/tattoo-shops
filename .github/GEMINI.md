Tech Stack & Architecture
Frontend: React (Vite), TypeScript, Tailwind CSS, shadcn/ui.

Backend: Express.js with tRPC (Type-safe API).

Database: PostgreSQL via Drizzle ORM.

Storage: Supabase Storage (Portfolio/Profile images).

Payments: Stripe SDK.

📐 Development Standards
Strict Typing: No any types. Use Zod schemas in shared/ for cross-stack validation.

Component Logic: Functional components only. If a file exceeds 150 lines, it must be decomposed.

Data Fetching: Use TanStack Query (via tRPC). Do not use external state managers (Redux/Zustand) for server-side data.

UI/UX: Use lucide-react for icons and shadcn/ui Skeletons for all loading states.

📋 Workflow & Quality Control
Database Changes: All schema updates must be handled via pnpm db:generate and pnpm db:push.

Image Handling: Portfolio uploads must be optimized/compressed before hitting Supabase.

Testing: Any new logic in shared/ requires a corresponding unit test in tests/.

Pre-Flight: Run pnpm build locally before any push to main to catch linting or TS errors.

Documentation: Keep TODO.md and API_KEYS_CHECKLIST.md updated as the source of truth for project momentum.
# Universal Inc - AI Agent Instructions

This project is a tattoo artist directory and booking platform. Use these rules when suggesting or writing code.

## 🛠 Tech Stack & Architecture

- **Frontend**: React + Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Express.js with tRPC for type-safe API calls.
- **Database**: PostgreSQL with Drizzle ORM.
- **Storage**: Supabase Storage for images.
- **Payments**: Stripe integration.

## 📐 Coding Standards

- **Strict TypeScript**: Always use explicit types; avoid `any`.
- **Component Style**: Use functional components with hooks. Break down components if they exceed 150 lines.
- **Iconography**: Use `lucide-react` for all icons.
- **API Pattern**: Use tRPC routers in `backend/server`. Validate all inputs with **Zod schemas** shared between frontend and backend.
- **Database**: Use Drizzle ORM for all queries. Manage changes via `pnpm db:generate` and `pnpm db:push`.

## ⚡ State & UI Rules

- **Data Fetching**: Use React Query (via tRPC) for server state. Avoid Redux/Zustand for API data.
- **User Experience**: Implement skeleton screens from shadcn/ui for all loading states.
- **Optimization**: Process portfolio images for performance before uploading to Supabase.

## 📋 Workflow & Quality

- **File Structure**: Follow the existing `backend/`, `frontend/client/`, and `tests/` layout.
- **Documentation**: Refer to `TODO.md` for priorities. Update `API_KEYS_CHECKLIST.md` for new credentials.
- **Code Clarity**: Prioritize clear naming over comments. Explain "why," not "what."
- **Testing**: New utility functions in `shared/` must have unit tests in the `tests/` folder.
- **Deployment**: Always run `pnpm build` locally to verify TypeScript and linting before pushing to `main`.

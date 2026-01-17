# AI Coding Agent Instructions for Universal Inc. Tattoo Artist Directory

## Project Overview
Full-stack web application for finding and booking tattoo artists. Built with React frontend, Node.js/Express backend, tRPC for type-safe APIs, Drizzle ORM with MySQL, S3 for image storage, Stripe for payments.

## Architecture
- **Monorepo structure**: `client/` (React + Vite), `server/` (Express + tRPC), `shared/` (types, constants), `drizzle/` (DB schema/migrations)
- **API**: tRPC procedures in `server/routers.ts`, client in `client/src/lib/trpc.ts`
- **Auth**: OAuth via Manus, session cookies, `useAuth` hook for client-side auth
- **DB**: MySQL with Drizzle, schema in `drizzle/schema.ts`
- **Components**: shadcn/ui in `client/src/components/ui/`, custom in `client/src/components/`
- **Pages**: Route-based in `client/src/pages/`, using Wouter for routing

## Key Workflows
- **Development**: `pnpm dev` runs server with Vite dev server
- **Build**: `pnpm build` builds client with Vite, bundles server with esbuild
- **DB**: `pnpm db:push` generates and runs migrations
- **Tests**: `pnpm test` runs Vitest on server tests
- **Type check**: `pnpm check` runs TypeScript

## Patterns & Conventions
- **Types**: Shared types from `shared/types.ts`, inferred from Drizzle schema
- **API calls**: Use tRPC hooks like `trpc.artists.getAll.useQuery()`
- **Error handling**: tRPC errors redirect to login on unauthorized
- **Styling**: Tailwind CSS with custom components, dark/light theme via next-themes
- **File uploads**: S3 presigned URLs for portfolio images
- **Auth flow**: Protected procedures check `ctx.user`, public for open access

## Examples
- Add artist feature: Create procedure in `server/routers.ts` artists router, add to schema if needed, use in component with tRPC hook
- New page: Add to `client/src/pages/`, route in `client/src/App.tsx`
- DB change: Update `drizzle/schema.ts`, run `pnpm db:push`

## External Integrations
- **Stripe**: Webhooks in `server/webhookHandler.ts`, checkout in `server/stripe.ts`
- **S3**: Upload via presigned URLs, client in `server/storage.ts`
- **OAuth**: Manus OAuth in `server/_core/oauth.ts`
- **Email**: Resend in `server/email.ts`
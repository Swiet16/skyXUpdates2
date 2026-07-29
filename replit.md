# SkyXpress International Courier & Cargo

A full-featured logistics web app for SkyXpress International — handling parcel management, shipment tracking, customer quotes, partner dashboards, and a super-admin control panel.

## Run & Operate

- Workflow `artifacts/skyxpress: web` starts the dev server automatically
- `pnpm --filter @workspace/skyxpress run dev` — run the frontend manually (port 20181)
- `pnpm run typecheck` — full typecheck across all packages
- Required env vars (set as Replit Secrets): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui
- Auth & DB: Supabase (PostgreSQL with Row-Level Security)
- Animation: Framer Motion
- Charts: Recharts
- Forms: react-hook-form + zod
- PDF/AWB: jsPDF + html2canvas + bwip-js (barcode generation)
- Routing: React Router DOM v6

## Where things live

- `artifacts/skyxpress/src/pages/` — top-level route pages (Index, Auth, Dashboard, Track, etc.)
- `artifacts/skyxpress/src/components/` — all UI components including role-based dashboards
- `artifacts/skyxpress/src/integrations/supabase/` — Supabase client + generated TypeScript types
- `artifacts/skyxpress/supabase-schema.sql` — full Supabase SQL schema with RLS policies
- `artifacts/skyxpress/src/hooks/` — custom hooks (useTheme, useLiveData, use-toast)

## Role-Based Dashboards

Three dashboard modes are rendered at `/dashboard` based on the authenticated user's role:

| Role | Component | Access |
|------|-----------|--------|
| `super_admin` | `SuperAdminDashboard.tsx` | All partners, parcels, users, analytics |
| `admin_partner` | `AdminPartnerDashboard.tsx` | Own parcels, customers, invoices, earnings |
| `user` | `UserDashboard.tsx` | Own shipments, tracking, requests |

Old role values (`admin`, `staff`, `developer`) are mapped to new roles via `resolveRole()` in `Dashboard.tsx`.

## Architecture decisions

- **Client-only Vite app** — no SSR; all data fetched client-side via Supabase JS SDK
- **Supabase RLS** — row-level security enforced at the DB layer; partner data isolation is guaranteed even if frontend logic has bugs
- **`VITE_SUPABASE_ANON_KEY` is a public key** — safe to expose; access is controlled by RLS policies
- **PDF features use real packages** — jsPDF, html2canvas, and bwip-js are installed; the legacy stubs have been removed

## User preferences

_Populate as needed._

## Gotchas

- `pnpm dev` at workspace root has no `dev` script — always use the workflow or `pnpm --filter @workspace/skyxpress run dev`
- After Supabase schema changes, regenerate types with the Supabase CLI and update `src/integrations/supabase/types.ts`
- The `.migration-backup/` directory is the original Vercel import — do not modify it

## Pointers

- See the `pnpm-workspace` skill for workspace structure and TypeScript setup
- Supabase schema: `artifacts/skyxpress/supabase-schema.sql`

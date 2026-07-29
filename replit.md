# SkyXpress International Courier & Cargo

A React + Vite web application for SkyXpress — an international courier and cargo service platform.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend/Auth:** Supabase (PostgreSQL + Auth)
- **Routing:** React Router v6
- **State:** TanStack Query
- **Charts:** Recharts
- **Monorepo:** pnpm workspace

## Key pages

| Route | Description |
|---|---|
| `/` | Landing / home page |
| `/auth` | Sign in / sign up |
| `/services` | Services listing |
| `/track` | Shipment tracking |
| `/quote` | Shipping quote calculator |
| `/network` | Partner network map |
| `/dashboard` | User/admin dashboard |
| `/manifest` | Shipment manifest |
| `/about`, `/contact`, `/terms` | Info pages |

## Running the app

```bash
pnpm install           # install all workspace dependencies
```

The **SkyXpress** workflow starts the dev server on port 20181.

## Environment variables

Configured in `.replit` `[userenv.shared]`:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key

## Database

See `artifacts/skyxpress/supabase-schema.sql` for the full schema.
Roles: `super_admin` | `admin_partner` | `user`

## User preferences

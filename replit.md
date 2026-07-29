# SkyXpress International Courier & Cargo

A React + Vite web application for SkyXpress — an international courier and cargo service platform.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend/Auth:** Supabase (PostgreSQL + Auth + Realtime)
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
| `/dashboard` | Role-based dashboard (3 views) |
| `/manifest` | Shipment manifest |
| `/about`, `/contact`, `/terms` | Info pages |

## Role-based dashboards (`/dashboard`)

| Role | Dashboard | Can create parcels | User management |
|---|---|---|---|
| `super_admin` | SuperAdminDashboard — all data, all partners | ✅ | ✅ Always |
| `admin` | AdminDashboard — own dedicated view | ✅ | ✅ If `can_manage_users=true` (set by super_admin) |
| `admin_partner` / `staff` | AdminPartnerDashboard — partner office | ✅ | ❌ |
| `user` | UserDashboard — track own parcels | ❌ | ❌ |

### Parcel tracking by creator
`ParcelManagement` accepts a `showCreator` prop. When `true`, a **Created By** column shows the creator's name and role badge for every parcel row. This is enabled on the admin dashboard.

### User management visibility
Super admin can grant/revoke the Users tab for any admin account by toggling `can_manage_users` in the UserManagement panel.

## Database schema additions

`skyxpress-schema.sql` (at repo root) contains idempotent SQL to run in the Supabase SQL editor:
- Adds `updated_by` + `updated_by_role` columns to `parcels`
- Adds `can_manage_users` boolean to `profiles`
- Trigger: auto-sets `updated_by` / `updated_by_role` on every parcel UPDATE
- View: `parcel_activity` — parcels with creator + updater names joined
- Indexes on `created_by` / `updated_by`
- Commented RLS policy examples for role-based row access

## Running the app

```bash
pnpm install           # install all workspace dependencies
```

The **artifacts/skyxpress: web** workflow starts the dev server on port 20181.

## Environment variables (Replit Secrets)

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key

## Vite stubs

Heavy packages (jsPDF, html2canvas, bwip-js) are stubbed in `artifacts/skyxpress/src/stubs/`. AWB/barcode/PDF download features show a graceful error; all other app flows work normally.

## User preferences

# SkyXpress International Courier & Cargo

A full-stack courier/cargo management platform for SkyXpress International.

## Stack

- **Frontend:** React + Vite + TypeScript (`artifacts/skyxpress`)
- **Backend:** Express API server (`artifacts/api-server`)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **UI:** Tailwind CSS + shadcn/ui components

## Running the app

The main app runs via the **`artifacts/skyxpress: web`** workflow:
```
pnpm --filter @workspace/skyxpress run dev
```
It binds to `PORT=20181`.

To install / reinstall dependencies:
```
pnpm install
```

## Environment variables required

Set these as Replit Secrets before the app can connect to live data:

| Secret | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

Until these are set the app runs in placeholder mode (no data).

## Database schema

`artifacts/skyxpress/supabase-schema.sql` — run in the Supabase SQL editor to create all tables, RLS policies, and seed data.

**Important:** `partner_id` must be added to `profiles` before RLS policies that reference it are created. `attached_assets/partners-schema-fixed.sql` contains the corrected ordering for the partners + pricing_config migration.

## Roles

| Role | Access |
|---|---|
| `super_admin` | Full access to everything |
| `admin_partner` | Own partner's data only |
| `user` | Own parcels / requests |

After running the schema, promote the first super admin:
```sql
UPDATE public.profiles SET role = 'super_admin' WHERE id = '<your-uid>';
```

## User preferences

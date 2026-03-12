# career nav frontend

Next.js (App Router) + React + Tailwind CSS MVP UI scaffold for Career Navigator.

## What’s included (initial)
- App layout: sidebar + topbar + main content area
- Core screens:
  - Dashboard (`/dashboard`)
  - Onboarding Hub (`/onboarding`)
- Reusable components:
  - `AppLayout`, `SidebarNavigation`, `TopBar`, `PageHeader`
  - `Card`, `StatCard`, `Button`, `ProgressStepper`, `FileUploader`
  - `Skeleton`, `EmptyState`

## Run locally
Install deps:
```bash
npm install
```

Run dev server:
```bash
# Uses PORT from .env in this container
npm run dev
```

Then open:
- http://localhost:3000 (redirects to `/dashboard`)

## Environment variables
This container already provides environment variables like:
- `PORT`
- `REACT_APP_API_BASE` (future API integration)

The current MVP UI uses placeholder data (no backend required yet).

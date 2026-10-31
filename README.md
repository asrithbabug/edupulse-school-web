# EduPulse school web app

The web app each school's office uses: admissions, staff, attendance, timetable,
subjects, exams, calendar, fees, announcements, staff permissions, bulk import
and support requests. Only **school admin** accounts sign in here.

Next.js 14 (static export) + Tailwind CSS. Talks to the EduPulse backend API
(`edupulse-backend`) at `NEXT_PUBLIC_API_URL/api/v1`.

## Run locally

```bash
npm install
cp .env.local.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                          # http://localhost:3000
```

Sign in with a school admin ID (e.g. `ADM001`). New school admins get their
login ID and a set-password link by email when a school is created in the admin
panel; the link opens `/set-password` in this app (the backend's `FRONTEND_URL`).

## Structure

```
app/login, app/set-password   Public pages
app/(school)/…                Signed-in pages (/dashboard, /students, /staff, /fees, …)
lib/api.js                    The only place that calls the API
lib/auth.js                   Stored session (token + user)
components/                   Shared UI (table, modal, sidebar, …)
```

## Deploy

`npm run build` produces static files in `out/`, served by Nginx (`deploy/nginx.conf`).
Every push to `main` builds and uploads them to the server (`.github/workflows/deploy.yml`).

GitHub settings needed: variable `NEXT_PUBLIC_API_URL` (e.g. `https://api.edupulse.in`),
secrets `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`. On the backend, set
`FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to this app's address.

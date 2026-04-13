# Dormitory Management System (DMS)

Clean Architecture based starter implementation aligned with the technical report:

- `Domain`: Core entities and business model
- `Application`: Contracts/interfaces for application logic
- `Infrastructure`: EF Core 8 + PostgreSQL persistence and security implementations
- `WebUI`: ASP.NET Core MVC presentation and API host
- `WebUI/ClientApp`: React + Tailwind frontend mockups (Login, Admin Dashboard)

## Prerequisites

- .NET SDK 8
- Docker Desktop (recommended, no local PostgreSQL install needed)
- Node.js 18+

## Quick Start (No Local PostgreSQL)

1. Start database in Docker:
   - `docker compose up -d postgres`
2. Apply migrations:
   - `dotnet ef database update --project src/DormitoryManagementSystem.Infrastructure --startup-project src/DormitoryManagementSystem.WebUI`
3. Start backend:
   - `dotnet run --project src/DormitoryManagementSystem.WebUI`
4. Start frontend:
   - `cd src/DormitoryManagementSystem.WebUI/ClientApp`
   - `npm install`
   - `npm run dev`

You can also run backend setup with:
- `powershell -ExecutionPolicy Bypass -File .\start-dev.ps1`

## Run Backend

1. Update connection string and secrets in:
   - `src/DormitoryManagementSystem.WebUI/appsettings.json`
2. Apply migrations:
   - `dotnet ef database update --project src/DormitoryManagementSystem.Infrastructure --startup-project src/DormitoryManagementSystem.WebUI`
3. Start web app:
   - `dotnet run --project src/DormitoryManagementSystem.WebUI`

## Run Frontend

```bash
cd src/DormitoryManagementSystem.WebUI/ClientApp
npm install
npm run dev
```

## Security Notes

- Password hashing: bcrypt (work factor 12)
- Token auth: JWT (default access token lifetime 15 minutes)
- Sensitive ID encryption at rest: AES-256 style configuration via app settings

## Seeded Users (Development)

- Admin: `admin@dms.local` / `P@ssw0rd!`
- Staff: `staff@dms.local` / `P@ssw0rd!`
- Student: `student@dms.local` / `P@ssw0rd!`

## API Endpoints (Initial)

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/admin/dashboard` (Admin role)
- `GET /api/staff/allocations` (Staff or Admin role)
- `GET /api/student/profile` (Student role)
- `POST /api/maintenance` (Student role)
- `PATCH /api/maintenance/status` (Staff/Admin role)
- `GET /api/maintenance/open` (Staff/Admin role)
- `GET /api/payments/me` (Student role)
- `POST /api/payments/{paymentId}/mark-paid` (Admin role)
- `GET /api/payments/pending` (Admin role)

## Auth Flow Notes

- Refresh token is written as `HttpOnly` cookie by `POST /api/auth/login`.
- Access token renewal can be done with `POST /api/auth/refresh` without passing token in body.

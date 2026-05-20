# VRR Events

VRR Events is a production-oriented full-stack event management web application being built phase by phase. This repository currently contains the Phase 1 project scaffold and documentation baseline.

## Current Phase

- Phase 1: Project Initialization & Folder Structure

## Completed In Phase 1

- Created the root project structure for `frontend` and `backend`
- Added backend MVC-oriented module directories
- Added frontend page entry files for the core user flows
- Added Git tracking support for otherwise-empty folders
- Added repository hygiene with a focused `.gitignore`
- Added initial setup, structure, and testing documentation

## Project Structure

```text
VRR/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   └── utils/
├── frontend/
│   ├── assets/
│   ├── components/
│   ├── css/
│   ├── js/
│   ├── booking.html
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   └── register.html
├── .gitignore
└── README.md
```

## Setup Instructions

1. Open the project in your terminal:

   ```powershell
   cd D:\VRR
   ```

2. Confirm the scaffold exists:

   ```powershell
   Get-ChildItem -Recurse
   ```

3. Use Phase 2 to initialize the backend runtime and Express server before attempting to run the application.

## Modules Status

- Landing page: structure pending implementation
- Authentication: pending
- Booking system: pending
- Admin dashboard: pending
- Organizer dashboard: pending
- Appointment scheduling: pending
- Budget estimation: pending
- Agreement PDF generation: pending
- Analytics dashboard: pending
- Workflow state management: pending

## APIs

No APIs are implemented in Phase 1. Backend endpoints will begin in Phase 2 after server initialization.

## Environment Variables

No environment variables are required in Phase 1. Environment configuration will be introduced in Phase 3.

## Testing Steps

1. Verify the directory tree matches the documented structure.
2. Confirm the frontend entry pages exist and open as plain HTML files.
3. Confirm `backend/uploads/.gitkeep` exists so the uploads directory remains tracked.
4. Confirm `.gitignore` excludes runtime artifacts and local secrets.

## Phase Notes

- This phase intentionally establishes structure only.
- No backend runtime, database connection, authentication flow, or business logic has been added yet.
- The next phase should initialize Node.js, Express, and the backend entrypoint.

# VRR Events

VRR Events is a production-oriented full-stack event management web application being built phase by phase. The repository now includes the Phase 1 scaffold and the Phase 2 backend Express foundation.

## Current Phase

- Phase 1: Project Initialization & Folder Structure
- Phase 2: Backend Setup & Express Server

## Completed Modules

### Phase 1

- Created the root project structure for `frontend` and `backend`
- Added backend MVC-oriented module directories
- Added frontend page entry files for the core user flows
- Added Git tracking support for otherwise-empty folders
- Added repository hygiene with a focused `.gitignore`

### Phase 2

- Added backend `package.json` with runtime and development scripts
- Added a modular Express application bootstrap
- Added versioned API routing under `/api/v1`
- Added a health-check controller and route
- Added centralized `404` and error-handling middleware
- Added graceful shutdown handling in the HTTP server entrypoint

## Project Structure

```text
VRR/
|-- backend/
|   |-- app.js
|   |-- package.json
|   |-- server.js
|   |-- config/
|   |   `-- constants.js
|   |-- controllers/
|   |   |-- healthController.js
|   |   `-- .gitkeep
|   |-- middleware/
|   |   |-- errorHandler.js
|   |   |-- notFound.js
|   |   `-- .gitkeep
|   |-- models/
|   |   `-- .gitkeep
|   |-- routes/
|   |   |-- index.js
|   |   `-- .gitkeep
|   |-- services/
|   |   `-- .gitkeep
|   |-- uploads/
|   |   `-- .gitkeep
|   `-- utils/
|       `-- .gitkeep
|-- frontend/
|   |-- assets/
|   |-- components/
|   |-- css/
|   |-- js/
|   |-- booking.html
|   |-- dashboard.html
|   |-- index.html
|   |-- login.html
|   `-- register.html
|-- .gitignore
`-- README.md
```

## Setup Instructions

1. Open the project:

   ```powershell
   cd D:\VRR
   ```

2. Install backend dependencies:

   ```powershell
   cd backend
   npm install
   ```

3. Start the backend in development mode:

   ```powershell
   npm run dev
   ```

4. Verify the backend health endpoint:

   ```text
   GET http://localhost:5000/api/v1/health
   ```

## Backend Scripts

- `npm start`: starts the backend with Node.js
- `npm run dev`: starts the backend with Nodemon

## Modules Status

- Landing page: UI pending
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

### Available In Phase 2

- `GET /`
  Returns API availability metadata.
- `GET /api/v1/health`
  Returns health status, environment, and server timestamp.

## Environment Variables

Environment variables are not required yet, but the server already supports:

- `PORT`: optional override for the default port `5000`
- `NODE_ENV`: optional runtime environment flag

Formal `.env` configuration will be introduced in Phase 3.

## Testing Steps

1. Run `npm install` inside `backend`.
2. Run `npm run dev`.
3. Open `http://localhost:5000/` and confirm the API status response.
4. Open `http://localhost:5000/api/v1/health` and confirm the health JSON response.
5. Call a missing route such as `http://localhost:5000/api/v1/missing` and confirm the `404` JSON error response.

## Phase Notes

- Phase 2 adds the backend runtime only.
- MongoDB connection and environment-file management begin in Phase 3.
- Authentication, booking logic, and dashboards are intentionally deferred to later phases.

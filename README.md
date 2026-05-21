# VRR Events

VRR Events is a production-oriented full-stack event management web application being built phase by phase. The repository now includes the scaffold, the Express backend foundation, validated MongoDB environment configuration, JWT-based backend authentication, frontend authentication pages, a full public landing page, booking workflow APIs, booking request UI, admin dashboard, organizer module, and appointment scheduling with conflict detection.

## Current Phase

- Phase 1: Project Initialization & Folder Structure
- Phase 2: Backend Setup & Express Server
- Phase 3: MongoDB Connection & Environment Variables
- Phase 4: Authentication System
- Phase 5: Frontend Authentication Pages
- Phase 6: Landing Page Development
- Phase 7: Booking System Backend
- Phase 8: Booking Form Frontend
- Phase 9: Admin Dashboard Backend
- Phase 10: Admin Dashboard Frontend
- Phase 11: Organizer Module
- Phase 12: Appointment Scheduling System

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

### Phase 3

- Added `.env`-based configuration loading with validation
- Added a MongoDB connection module using Mongoose
- Added startup protection so the API only boots with valid configuration
- Added database connection state to the health endpoint
- Added a committed `backend/.env.example` template

### Phase 4

- Added a `User` model with hashed passwords and role support
- Added registration and login endpoints
- Added JWT token generation and protected-route middleware
- Added authenticated profile retrieval via `/api/v1/auth/me`
- Added JWT environment configuration requirements

### Phase 5

- Added login and register pages built with HTML, CSS, and vanilla JavaScript
- Added client-side validation for backend URL, name, email, password, and password confirmation
- Added frontend auth modules for API requests, token storage, and session guards
- Added local-storage session persistence and sign-out handling
- Added a lightweight authenticated dashboard handoff page for session verification

### Phase 6

- Replaced the landing-page placeholder with a full marketing homepage
- Added hero, services, portfolio, counters, testimonials, and booking CTA sections
- Added responsive navigation and mobile menu behavior
- Added animated stats, reveal-on-scroll effects, and rotating testimonials
- Added dedicated landing-page CSS and JavaScript assets

### Phase 7

- Added a `Booking` model with workflow state tracking and history
- Added booking creation, listing, and detail APIs
- Added a workflow-state catalog endpoint for frontend and dashboard use
- Added role-aware booking access rules for clients, admins, and organizers
- Added booking service helpers for validation, access filters, and response shaping

### Phase 8

- Replaced the booking placeholder page with a full event-request form
- Added dynamic client-side validation for booking payload requirements
- Added local draft persistence for incomplete booking forms
- Added post-login redirect persistence so booking drafts survive authentication
- Added workflow-state preview and post-submit confirmation UI

### Phase 9

- Added admin-only booking management APIs with filtering and pagination
- Added organizer directory and booking-to-organizer assignment APIs
- Added admin workflow-state update API with transition validation and history entries
- Added analytics overview and monthly trend APIs for dashboard cards and charts
- Added shared backend helpers for admin booking filters and workflow transition rules

### Phase 10

- Replaced the authenticated session placeholder with a full admin dashboard UI
- Added admin analytics cards, monthly booking trend visualization, workflow-state breakdown, and recent booking activity
- Added booking table filters for search, workflow state, organizer assignment, and event type
- Added booking pagination controls connected to the admin backend
- Added organizer assignment and workflow update actions with optional admin notes
- Added role guarding so only admin accounts can use `dashboard.html`
- Added a dedicated admin dashboard CSS file and admin API frontend module

### Phase 11

- Added organizer-only backend routes under `/api/v1/organizer`
- Added assigned-event listing with organizer dashboard summary counts
- Added organizer progress-state catalog for event progress controls
- Added organizer progress update endpoint scoped to assigned bookings only
- Limited organizer workflow updates to `EVENT_SCHEDULED`, `EVENT_IN_PROGRESS`, and `EVENT_COMPLETED`
- Added a dedicated organizer dashboard page for assigned events, schedule details, client details, progress updates, and workflow history
- Added role-aware login/register dashboard routing for admins, organizers, and clients

### Phase 12

- Added an `Appointment` model with booking, client, organizer, schedule, mode, status, and notes fields
- Added role-aware appointment listing for admins, organizers, and clients
- Added appointment scheduling with validation for booking access, future date/time, duration, type, and mode
- Added organizer conflict detection to block overlapping active appointments
- Added appointment status updates for scheduled, rescheduled, cancelled, and completed states
- Added a shared appointment scheduling frontend page
- Added appointment links from admin dashboard, organizer dashboard, and booking flow
- Added client booking-list API helper for appointment scheduling

## Project Structure

```text
VRR/
|-- backend/
|   |-- .env.example
|   |-- app.js
|   |-- package.json
|   |-- package-lock.json
|   |-- server.js
|   |-- config/
|   |   |-- database.js
|   |   `-- env.js
|   |-- controllers/
|   |   |-- adminController.js
|   |   |-- appointmentController.js
|   |   |-- authController.js
|   |   |-- bookingController.js
|   |   |-- healthController.js
|   |   |-- organizerController.js
|   |   `-- .gitkeep
|   |-- middleware/
|   |   |-- auth.js
|   |   |-- errorHandler.js
|   |   |-- notFound.js
|   |   `-- .gitkeep
|   |-- models/
|   |   |-- Appointment.js
|   |   |-- Booking.js
|   |   |-- User.js
|   |   `-- .gitkeep
|   |-- routes/
|   |   |-- adminRoutes.js
|   |   |-- appointmentRoutes.js
|   |   |-- authRoutes.js
|   |   |-- bookingRoutes.js
|   |   |-- index.js
|   |   |-- organizerRoutes.js
|   |   `-- .gitkeep
|   |-- services/
|   |   |-- adminService.js
|   |   |-- appointmentService.js
|   |   |-- authService.js
|   |   |-- bookingService.js
|   |   |-- organizerService.js
|   |   `-- .gitkeep
|   |-- uploads/
|   |   `-- .gitkeep
|   `-- utils/
|       |-- asyncHandler.js
|       |-- bookingWorkflow.js
|       |-- createHttpError.js
|       |-- validators.js
|       `-- .gitkeep
|-- frontend/
|   |-- assets/
|   |-- components/
|   |-- css/
|   |   |-- admin-dashboard.css
|   |   |-- appointments.css
|   |   |-- auth.css
|   |   |-- booking.css
|   |   |-- landing.css
|   |   `-- organizer-dashboard.css
|   |-- js/
|   |   |-- admin-api.js
|   |   |-- appointment-api.js
|   |   |-- appointments.js
|   |   |-- api-client.js
|   |   |-- auth-api.js
|   |   |-- auth-config.js
|   |   |-- auth-storage.js
|   |   |-- auth-ui.js
|   |   |-- auth-validation.js
|   |   |-- booking-api.js
|   |   |-- booking-storage.js
|   |   |-- booking-validation.js
|   |   |-- booking.js
|   |   |-- dashboard-routing.js
|   |   |-- dashboard.js
|   |   |-- landing.js
|   |   |-- login.js
|   |   |-- organizer-api.js
|   |   |-- organizer-dashboard.js
|   |   |-- package.json
|   |   `-- register.js
|   |-- booking.html
|   |-- appointments.html
|   |-- dashboard.html
|   |-- index.html
|   |-- login.html
|   |-- organizer-dashboard.html
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
   npm.cmd install
   ```

3. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Update `MONGODB_URI` inside `backend/.env` to match your local MongoDB instance or MongoDB Atlas connection string.
5. Set `JWT_SECRET` in `backend/.env` to a long random secret string.

6. Start the backend in development mode:

   ```powershell
   npm.cmd run dev
   ```

7. Serve the frontend from a local web server that uses `http://localhost:5500` or `http://127.0.0.1:5500`.

   Example options:
   - VS Code Live Server on port `5500`
   - any static server configured to use port `5500`

8. Open the authentication pages in your browser:

   ```text
   http://localhost:5500/index.html
   http://localhost:5500/booking.html
   http://localhost:5500/login.html
   http://localhost:5500/register.html
   ```

9. Verify the backend health endpoint:

   ```text
   GET http://localhost:5000/api/v1/health
   ```

## Backend Scripts

- `npm start`: starts the backend with Node.js
- `npm run dev`: starts the backend with Nodemon

## Modules Status

- Landing page: complete
- Authentication: backend and frontend complete
- Booking system: backend and frontend request flow complete
- Admin dashboard: backend and frontend complete
- Organizer dashboard: backend and frontend complete
- Appointment scheduling: backend and frontend complete
- Budget estimation: pending
- Agreement PDF generation: pending
- Analytics dashboard: pending
- Workflow state management: pending

## APIs

### Available Through Phase 10

- `GET /`
  Returns API availability metadata.
- `GET /api/v1/health`
  Returns health status, environment, database state, and server timestamp.
- `POST /api/v1/auth/register`
  Creates a new client account and returns a JWT token.
- `POST /api/v1/auth/login`
  Authenticates an existing user and returns a JWT token.
- `GET /api/v1/auth/me`
  Returns the currently authenticated user profile when a valid Bearer token is supplied.
- `GET /api/v1/bookings/workflow-states`
  Returns the ordered booking workflow states used by the platform.
- `POST /api/v1/bookings`
  Creates a booking request for the authenticated user.
- `GET /api/v1/bookings`
  Returns the bookings accessible to the authenticated user.
- `GET /api/v1/bookings/:bookingId`
  Returns a specific accessible booking, including workflow history.
- `GET /api/v1/admin/bookings`
  Returns the admin booking table dataset with filters and pagination.
- `GET /api/v1/admin/bookings/:bookingId`
  Returns a single booking for admin review.
- `PATCH /api/v1/admin/bookings/:bookingId/assign-organizer`
  Assigns or clears an organizer on a booking.
- `PATCH /api/v1/admin/bookings/:bookingId/workflow-state`
  Moves a booking to a later workflow state and records history.
- `GET /api/v1/admin/organizers`
  Returns organizers plus assignment counts.
- `GET /api/v1/admin/analytics/overview`
  Returns admin dashboard summary metrics and recent bookings.
- `GET /api/v1/admin/analytics/monthly`
  Returns monthly booking creation and guest-count trends.
- `GET /api/v1/organizer/assignments`
  Returns the authenticated organizer's assigned bookings and summary counts.
- `GET /api/v1/organizer/progress-states`
  Returns organizer-manageable progress states.
- `PATCH /api/v1/organizer/assignments/:bookingId/progress`
  Allows the assigned organizer to move an event forward through allowed progress states.
- `GET /api/v1/appointments`
  Returns appointments visible to the authenticated user's role.
- `POST /api/v1/appointments`
  Schedules an appointment for an accessible booking with organizer conflict detection.
- `GET /api/v1/appointments/catalog`
  Returns appointment types, modes, and statuses for frontend controls.
- `PATCH /api/v1/appointments/:appointmentId/status`
  Updates the status of an accessible appointment.

## Frontend Auth Pages

- `frontend/login.html`
  Logs an existing user in and stores the JWT session in browser local storage.
- `frontend/register.html`
  Creates a client account, validates form inputs, and stores the returned JWT session.
- `frontend/dashboard.html`
  Provides the admin dashboard when the stored session belongs to an admin account.
- `frontend/organizer-dashboard.html`
  Provides the organizer dashboard when the stored session belongs to an organizer account.
- `frontend/appointments.html`
  Provides the shared role-aware appointment scheduling and appointment list experience.

## Landing Page

- `frontend/index.html`
  Public-facing homepage with hero, service overview, portfolio showcase, counters, testimonials, and booking CTA.
- `frontend/css/landing.css`
  Dedicated visual system and responsive layout for the landing page.
- `frontend/js/landing.js`
  Handles stat animations, reveal effects, testimonial rotation, and mobile navigation behavior.

## Booking Frontend

- `frontend/booking.html`
  Auth-aware booking request page with draft persistence, validation, and submission confirmation.
- `frontend/css/booking.css`
  Dedicated layout and visual styling for the booking request experience.
- `frontend/js/booking.js`
  Handles workflow preview loading, form state, validation, auth redirect persistence, and booking submission.
- `frontend/js/booking-api.js`
  Connects the booking page to `/api/v1/bookings` and `/api/v1/bookings/workflow-states`.
- `frontend/js/booking-storage.js`
  Persists the booking draft locally between reloads and auth redirects.
- `frontend/js/booking-validation.js`
  Mirrors the key booking validation rules before the request reaches the backend.

## Booking Backend

- `backend/models/Booking.js`
  Stores event request details, workflow state, and workflow history.
- `backend/controllers/bookingController.js`
  Handles booking creation, listing, detail access, and workflow-state retrieval.
- `backend/routes/bookingRoutes.js`
  Mounts booking APIs under `/api/v1/bookings`.
- `backend/services/bookingService.js`
  Validates booking payloads, shapes responses, and applies access rules.
- `backend/utils/bookingWorkflow.js`
  Defines the canonical booking workflow states and labels.

## Admin Backend

- `backend/controllers/adminController.js`
  Handles admin booking management, organizer assignment, and analytics endpoints.
- `backend/routes/adminRoutes.js`
  Mounts admin-only APIs under `/api/v1/admin`.
- `backend/services/adminService.js`
  Applies admin filters, analytics aggregation, and assignment/workflow update logic.

## Admin Dashboard Frontend

- `frontend/dashboard.html`
  Admin operations dashboard with analytics, booking filters, booking table, workflow updates, organizer assignment, and recent activity.
- `frontend/css/admin-dashboard.css`
  Dedicated responsive visual styling for the admin dashboard experience.
- `frontend/js/admin-api.js`
  Frontend API adapter for `/api/v1/admin` booking, organizer, assignment, workflow, and analytics endpoints.
- `frontend/js/dashboard.js`
  Guards admin access, loads dashboard data, renders booking operations, handles pagination, and submits admin updates.

## Organizer Module

- `backend/controllers/organizerController.js`
  Handles assigned-event retrieval, progress-state catalog responses, and organizer progress updates.
- `backend/routes/organizerRoutes.js`
  Mounts organizer-only APIs under `/api/v1/organizer`.
- `backend/services/organizerService.js`
  Enforces assigned-booking scope and organizer-safe workflow progress transitions.
- `frontend/organizer-dashboard.html`
  Organizer workspace for assigned events, event details, progress updates, and recent workflow history.
- `frontend/css/organizer-dashboard.css`
  Dedicated responsive styling for the organizer dashboard.
- `frontend/js/organizer-api.js`
  Frontend API adapter for organizer assignment and progress endpoints.
- `frontend/js/organizer-dashboard.js`
  Guards organizer access, renders assignments, submits progress updates, and refreshes summary cards.
- `frontend/js/dashboard-routing.js`
  Routes admins, organizers, and clients to the correct post-auth workspace.

## Appointment Scheduling

- `backend/models/Appointment.js`
  Stores booking-linked appointment details, timing, role references, status, mode, location, meeting link, and notes.
- `backend/controllers/appointmentController.js`
  Handles appointment listing, scheduling, catalog retrieval, and status updates.
- `backend/routes/appointmentRoutes.js`
  Mounts protected appointment APIs under `/api/v1/appointments`.
- `backend/services/appointmentService.js`
  Validates scheduling input, enforces role-aware booking access, resolves organizers, and prevents overlapping organizer appointments.
- `frontend/appointments.html`
  Shared scheduling page for admins, organizers, and clients.
- `frontend/css/appointments.css`
  Responsive appointment scheduling and calendar queue styling.
- `frontend/js/appointment-api.js`
  Frontend API adapter for appointment endpoints.
- `frontend/js/appointments.js`
  Loads role-aware bookings, organizers, appointments, catalogs, schedule submissions, and appointment status updates.

## Environment Variables

Configured in `backend/.env`:

- `PORT`: optional backend port override, default `5000`
- `NODE_ENV`: runtime environment, default `development`
- `MONGODB_URI`: required MongoDB connection string
- `JWT_SECRET`: required secret used to sign and verify JWTs
- `JWT_EXPIRES_IN`: optional JWT lifetime, default `7d`
- `CORS_ORIGINS`: comma-separated list of allowed frontend origins

## Testing Steps

1. Run `npm.cmd install` inside `backend`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Start MongoDB locally or prepare a MongoDB Atlas URI.
4. Add a `JWT_SECRET` to `backend/.env`.
5. Run `npm.cmd run dev`.
6. Serve `frontend/` on `http://localhost:5500` or `http://127.0.0.1:5500`.
7. Open `index.html` and confirm the public landing page renders with all requested sections.
8. Verify the mobile navigation toggle works on a narrow viewport.
9. Scroll through the page and confirm reveal animations and counter animations trigger correctly.
10. Confirm testimonial rotation works and the dot controls switch testimonials.
11. Open `booking.html` and confirm the workflow preview loads from the backend.
12. Fill part of the booking form while signed out, submit it, and confirm you are redirected to `login.html`.
13. Log in and confirm you return to `booking.html` with the saved draft restored.
14. Submit a valid booking request and confirm the success panel shows a booking code and `REQUEST_SUBMITTED`.
15. Confirm invalid frontend values show inline errors before the request is sent.
16. Confirm the backend still rejects invalid payloads if you bypass frontend validation.
17. Create or promote an admin user and an organizer user for admin API verification.
18. Call `GET /api/v1/admin/bookings` with an admin token and confirm the booking table data is returned.
19. Call `GET /api/v1/admin/organizers` and confirm organizer assignment counts are returned.
20. Call `PATCH /api/v1/admin/bookings/:bookingId/assign-organizer` and confirm the organizer assignment is updated.
21. Call `PATCH /api/v1/admin/bookings/:bookingId/workflow-state` and confirm the workflow moves forward with a new history entry.
22. Call `GET /api/v1/admin/analytics/overview` and `GET /api/v1/admin/analytics/monthly` and confirm analytics data is returned.
23. Log in through `frontend/login.html` with an admin account and open `frontend/dashboard.html`.
24. Confirm dashboard metrics, monthly analytics, workflow breakdown, recent bookings, and booking table data load from the backend.
25. Apply search, workflow, organizer, and event-type filters and confirm the booking table updates.
26. Use pagination controls when enough bookings exist to produce multiple pages.
27. Assign or clear an organizer from the booking table and confirm the row updates after refresh.
28. Move a booking to a later workflow state and confirm the dashboard shows the new state.
29. Log in with a non-admin account, open `dashboard.html`, and confirm the page blocks access and redirects away.
30. Log in with an organizer account and confirm authentication redirects to `organizer-dashboard.html`.
31. Confirm `GET /api/v1/organizer/assignments` returns only bookings assigned to the organizer.
32. Assign a booking to the organizer from the admin dashboard, move it to `EVENT_SCHEDULED`, then refresh the organizer dashboard.
33. Update progress to `EVENT_IN_PROGRESS` and then `EVENT_COMPLETED` from the organizer dashboard.
34. Confirm organizer progress updates append workflow history entries.
35. Confirm organizer attempts to update unassigned bookings return `404`.
36. Confirm organizer attempts to move bookings backward or update pre-scheduled bookings return `400`.
37. Open `frontend/appointments.html` as an admin and confirm bookings and organizer options load.
38. Schedule an appointment with a future start time and confirm it appears in the appointment list.
39. Attempt to schedule another active appointment for the same organizer with overlapping times and confirm the API returns `409`.
40. Open `frontend/appointments.html` as an organizer and confirm only assigned booking appointments are visible.
41. Open `frontend/appointments.html` as a client and confirm only client-owned booking appointments are visible.
42. Update appointment status to `completed` or `cancelled` and confirm the list refreshes.
43. Confirm invalid appointment inputs, past start times, and invalid durations are rejected.
44. Confirm `GET /api/v1/health` still reports the expected health response.
45. Confirm startup fails clearly if `JWT_SECRET` or `MONGODB_URI` is missing.

## Phase Notes

- Phase 3 adds database bootstrapping and env validation.
- The backend now requires a valid `MONGODB_URI` before startup.
- Phase 4 adds JWT-based authentication for client accounts.
- Admin and organizer authorization can now build on the shared `role` field and `protect` middleware.
- Phase 5 adds browser-side session management using local storage.
- Frontend auth expects the API base URL to default to `http://localhost:5000/api/v1`.
- Phase 6 adds the public-facing marketing experience for visitor discovery and booking conversion.
- Phase 7 adds the backend foundation for booking requests and booking-progress tracking.
- Phase 8 adds the frontend booking form and login-return persistence for saved drafts.
- Phase 9 adds the backend APIs required for admin booking operations and analytics.
- Phase 10 adds the frontend admin dashboard for analytics, filtering, assignment, pagination, and workflow updates.
- Phase 11 adds organizer assignment views and assigned-event progress updates.
- Phase 12 adds role-aware appointment scheduling, status management, and organizer conflict detection.
- Quotation, agreement, notifications, and deployment work are intentionally deferred to later phases.

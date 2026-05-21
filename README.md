# VRR Events

VRR Events is a production-oriented full-stack event management web application being built phase by phase. The repository now includes the scaffold, the Express backend foundation, validated MongoDB environment configuration, JWT-based backend authentication, frontend authentication pages, a full public landing page, booking workflow backend APIs, and a real booking request frontend with login-return persistence.

## Current Phase

- Phase 1: Project Initialization & Folder Structure
- Phase 2: Backend Setup & Express Server
- Phase 3: MongoDB Connection & Environment Variables
- Phase 4: Authentication System
- Phase 5: Frontend Authentication Pages
- Phase 6: Landing Page Development
- Phase 7: Booking System Backend
- Phase 8: Booking Form Frontend

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
|   |   |-- authController.js
|   |   |-- bookingController.js
|   |   |-- healthController.js
|   |   `-- .gitkeep
|   |-- middleware/
|   |   |-- auth.js
|   |   |-- errorHandler.js
|   |   |-- notFound.js
|   |   `-- .gitkeep
|   |-- models/
|   |   |-- Booking.js
|   |   |-- User.js
|   |   `-- .gitkeep
|   |-- routes/
|   |   |-- authRoutes.js
|   |   |-- bookingRoutes.js
|   |   |-- index.js
|   |   `-- .gitkeep
|   |-- services/
|   |   |-- authService.js
|   |   |-- bookingService.js
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
|   |   |-- auth.css
|   |   |-- booking.css
|   |   `-- landing.css
|   |-- js/
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
|   |   |-- dashboard.js
|   |   |-- landing.js
|   |   |-- login.js
|   |   |-- package.json
|   |   `-- register.js
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
- Admin dashboard: pending
- Organizer dashboard: pending
- Appointment scheduling: pending
- Budget estimation: pending
- Agreement PDF generation: pending
- Analytics dashboard: pending
- Workflow state management: pending

## APIs

### Available Through Phase 7

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

## Frontend Auth Pages

- `frontend/login.html`
  Logs an existing user in and stores the JWT session in browser local storage.
- `frontend/register.html`
  Creates a client account, validates form inputs, and stores the returned JWT session.
- `frontend/dashboard.html`
  Confirms the stored session by calling `/api/v1/auth/me` and allows sign-out.

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
17. Call `GET /api/v1/bookings` after submission and confirm the booking appears in the authenticated user's list.
18. Confirm `GET /api/v1/health` still reports the expected health response.
19. Confirm startup fails clearly if `JWT_SECRET` or `MONGODB_URI` is missing.

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
- Authentication, booking logic, and dashboards are intentionally deferred to later phases.

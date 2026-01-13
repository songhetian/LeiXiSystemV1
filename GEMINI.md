# LeiXi System (雷犀客服管理系统) - Gemini Context

## Project Overview

**LeiXi System** is a comprehensive Customer Service Management Platform designed as a desktop application. It utilizes a modern split architecture (Frontend + Backend) wrapped in Electron for cross-platform desktop capabilities.

### Tech Stack
*   **Frontend:** React 18, Vite, Tailwind CSS, Ant Design, Zustand (State Management), Socket.IO Client.
*   **Backend:** Node.js, Fastify, Socket.IO, JWT Auth.
*   **Database:** MySQL 8.0 (accessed via `mysql2`).
*   **Desktop Wrapper:** Electron.
*   **Environment:** Windows/macOS/Linux.

## Architecture

The application operates as a local client-server model packaged together:
1.  **Backend (`/server`):** A Fastify server running locally (or on a server) handling API requests, database connections, and real-time WebSocket communication.
2.  **Frontend (`/src`):** A React SPA served by Vite (dev) or static files (prod), communicating with the backend via HTTP/REST and WebSockets.
3.  **Database:** MySQL instance required.
4.  **Electron:** Wraps the frontend and manages the background server process.

## Key Directories

*   **`src/`**: React Frontend source code.
    *   `components/`: Reusable UI components.
    *   `pages/`: Main application views/routes.
    *   `services/`: API integration and WebSocket services.
    *   `contexts/`: React Context providers (Auth, Theme).
    *   `styles/`: Global styles and Tailwind configuration.
*   **`server/`**: Node.js Backend source code.
    *   `index.js`: Main entry point, server configuration, and route registration.
    *   `routes/`: API route handlers (business logic).
    *   `middleware/`: Auth checks (`checkPermission.js`), user status.
    *   `migrations/`: Backend-specific migrations (often JS-based).
*   **`database/`**: SQL-based Database management.
    *   `migrations/`: SQL migration files for schema changes.
    *   `test-data/` or `seeds/`: Data seeding scripts.
*   **`electron/`**: Electron main process logic.
*   **`scripts/`**: Utility scripts for database management (`run-migrations.js`, `run-seed.js`) and build processes.
*   **`config/`**: Configuration files (Database config `db-config.json`).

## Development Workflow

### Prerequisites
*   Node.js >= 16.0.0
*   MySQL >= 8.0 (Running and accessible)

### Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    *   Copy `.envexample` to `.env`.
    *   Configure `config/db-config.json` (or ensure `.env` matches logic).
3.  **Initialize Database:**
    ```bash
    npm run db:reset  # CAUTION: Wipes database and reseeds
    # OR
    npm run db:migrate
    npm run db:seed
    ```

### Running the App
*   **Full Dev Mode (Server + React + Electron):**
    ```bash
    npm start
    ```
*   **Backend Only:** `npm run dev:server`
*   **Frontend Only:** `npm run dev:react`

### Building
*   **Production Build:** `npm run build`
*   **Package for OS:** `npm run package:win` (or `:mac`, `:linux`)

## Coding Conventions

### Frontend (React)
*   **State:** Use **Zustand** for global state, React `useState`/`useReducer` for local state.
*   **Styling:** **Tailwind CSS** for layout and spacing; **Ant Design** for complex components.
*   **API:** Use centralized services in `src/services/` for API calls.
*   **Components:** Functional components with Hooks.

### Backend (Fastify)
*   **Routes:** Modularized in `server/routes/`. Register in `server/index.js`.
*   **Async/Await:** Use `async/await` for all DB operations.
*   **Responses:** Standard JSON format: `{ success: boolean, data: any, message: string }`.
*   **Security:** Verify permissions using `extractUserPermissions` middleware.

### Database
*   **Migrations:** Changes to schema **MUST** be done via migration scripts in `database/migrations/` or `server/migrations/`.
*   **Naming:** Snake_case for tables and columns (`user_id`, `created_at`).

## Common Tasks

### Adding a New Feature
1.  **Database:** Create a migration file for new tables/columns. Run migration.
2.  **Backend:**
    *   Create `server/routes/new-feature.js`.
    *   Define routes (GET, POST, etc.).
    *   Register route in `server/index.js`.
3.  **Frontend:**
    *   Create API service methods in `src/services/`.
    *   Create UI components in `src/pages/`.
    *   Add route in `src/App.jsx`.

### Debugging
*   **Backend Logs:** Check the terminal running `npm run server`.
*   **Frontend Logs:** Browser Console (DevTools).
*   **Electron:** Main process logs appear in the terminal; Renderer logs in the DevTools window.

## Recent Changes (2026-01-14)

### 1. Fixed "Cannot read properties of null (reading 'targetUsers')"
*   **Location:** `src/pages/Admin/BroadcastManagement.jsx`
*   **Issue:** The preview modal tried to access `previewData.targetUsers` while `previewData` was null (e.g., during initial render or before form validation passed).
*   **Fix:** Added optional chaining (`previewData?.targetUsers?.length`) to safely access the property.

### 2. Improved Redis Connection Stability
*   **Location:** `server/index.js`
*   **Changes:**
    *   Forced `family: 4` (IPv4) to avoid IPv6 resolution delays.
    *   Enabled `keepAlive: 10000` (10s) to prevent idle timeouts from firewalls/routers.
    *   Added a custom `retryStrategy` with exponential backoff (min 50ms, max 2000ms).
    *   Set `connectTimeout: 10000` (10s) and `maxRetriesPerRequest: 3`.
*   **Verification:** Verified `server/websocket.js` inherits these settings via `redis.duplicate()`.


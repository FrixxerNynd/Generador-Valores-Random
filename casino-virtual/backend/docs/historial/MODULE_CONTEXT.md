# Module Context: Historial (Wallet Integration)

## Project Metadata
- **Module Scope:** `backend/src/historial/` and `frontend/app/historial/`
- **Related Modules:** `WalletModule` (Database source)
- **Dependencies:** Firebase/Firestore (operations stored in `History` collection by Wallet).

## Current Phase
Phase 2: Complete (Backend and Frontend Hook Integrated)

## Constraints
- **Architectural Shift:** Historial will now act as a consumer of the `History` collection managed by Firebase Firestore (implemented by the Wallet team), abandoning the isolated SQLite approach.
- **Data Mapping Requirement:** The backend stores entries as `TransactionDocument` (`Action`, `Currency_Type`, `Amount`). The frontend UI expects `HistorialRecord` (`categoria`, `dinero`, `fichas`). The Backend API will perform this mapping when querying data to keep the API contract aligned with the Frontend expectations without forcing the frontend teammate to change their UI.
- **Read-Only:** The backend `HistorialModule` will no longer have endpoints to insert history. Real transactions are tracked automatically by Wallet use-cases. Historial is strictly READ-ONLY.
- **Mocking User:** For testing purposes during connection, we will query a hardcoded user ID if no auth context is fully available yet.
- **Environment Initialization:** Environment variables required by external modules (like Firebase inside WalletModule) must be injected via `ConfigService` in a `useFactory` pattern, or else `INVALID_ARGUMENT` errors will occur on load due to undefined variables.
- **Frontend Port Connection:** Any separate port communication requires `app.enableCors()` configuration inside `main.ts`.

## Implemented Features
- **Backend API**: `GET /history/:user_id` exposing translated real-time Firestore database items from `WalletModule`.
- **Frontend Connection**: Successfully attached Next.js hook `useHistory.ts` via native `fetch` API, eliminating static mock data.

## Architecture Decisions
- We will map Wallet Actions to Frontend Categories strictly in the Backend service layer:
  - `DEPOSIT` / `WITHDRAW` -> `Deposito`
  - `BET` / `WIN` -> `Juego`
  - `CONVERT_TO_CHIPS` -> `Convercion`
- Keep the `ActivityHistoryTable` frontend UI that the teammate built completely intact to prevent merge conflicts and save time.

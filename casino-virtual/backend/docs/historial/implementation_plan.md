# Implementation Plan: Historial (Real Integration)

## Overview
Implement the Historial module from scratch on the `wallet` branch. Focus on querying the real Firestore `History` collection populated by the Wallet module, and adapt the frontend to consume this real data while preserving the teammate's new UI.

## Dependencies
- **Depends On:** WalletModule (Firebase/Firestore connection logic)
- **External Resources:** Firebase environment variables (`.env`)

## Phase 1: Backend API Re-implementation
### Goals
Create the REST controller and service to fetch records from Firestore and map them to the frontend expected schema.

### Tasks
- [x] Initialize `HistorialModule`, `HistorialController`, and `GetHistoryService`.
- [x] Implement logic in `GetHistoryService` to query the `History` Firestore collection based on `userId`.
- [x] Map Firestore documents into the UI schema (`categoria`, `dinero`, `fichas`, `fecha`, `descripcion`) using the defined translation rules.
- **Files:**
  - `backend/src/historial/historial.module.ts`
  - `backend/src/historial/infrastructure/historial.controller.ts`
  - `backend/src/historial/application/get-history.service.ts`

## Phase 2: Frontend Data Hook Adaptation
### Goals
Remove the mock data from `useHistory.ts` in the frontend and fetch from our new backend endpoint.

### Tasks
- [x] Update `useHistory.ts` to execute `fetch()` requests against `http://localhost:3000/history/{userId}`.
- [x] Remove all mock entries and handle `isLoading` / `error` states based on the real network request.
- [x] Allow the `<ActivityHistoryTable />` to render the mapped data gracefully.
- **Files:**
  - `frontend/lib/hooks/useHistory.ts`

## Phase 3: Administrator Dashboard Integration 
### Goals
Connect the existing Frontend Admin UI (`/admin/analytics`) to the backend to display absolute platform history (Global Ledger) and allow exporting to CSV.

### Architecture Decisions (By Architecture Agent)
1.  **Security Bypass (Demo Context):** To expedite the presentation, `/admin` routes will remain unrestricted. Real JWT Role validation is deferred to a future Security Phase.
2.  **Global Collection Fetching:** Instead of paginating/filtering complex queries via Firestore compound indexes (which requires manual index building in the Firebase Auth console), the Backend will fetch the complete collection and send it to the frontend. React will handle the "Intelligent Search" filtering in-memory (`filteredLogs`).
3.  **Backend CSV Generation:** The export process will be processed in a specialized endpoint `/history/admin/export` returning an `application/csv` blob, proving robust backend capabilities to the professor instead of a cheap frontend slice.

### Tasks
- [x] Backend: Create `adminGetHistory` method in Wallet's `GetHistoryUseCase` (or a direct bypass) that queries the `History` collection *without* a specific `userId`.
- [x] Backend: Expose `GET /history/admin` in `HistorialController` mapping all transactions to the `AdminLog` schema.
- [x] Backend: Expose `GET /history/admin/export`. Use a lightweight builder to parse JSON to CSV format and stream it down.
- [x] Frontend: Create a `useAdminHistory.ts` hook for the `/admin/analytics` page.
- [x] Frontend: Replace the hardcoded `ANALYTICS_LOGS` inside `app/admin/analytics/page.tsx` with dynamic state data.
- [x] Frontend: Wire the `EXPORT CSV` button to download the blob from the backend.

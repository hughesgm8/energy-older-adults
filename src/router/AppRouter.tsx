/**
 * # AppRouter Component
 *
 * The `AppRouter` component defines the routing structure for the Energy Dashboard application. 
 * It uses `react-router-dom` to manage navigation between different views.
 *
 * ## Key Features
 * - **Participant Selector**:
 *   - Displays the `ParticipantSelector` component at the root path (`/`), allowing users to select a participant.
 * - **Dashboard View**:
 *   - Displays the `Dashboard` component at the `/participant/:participantId` path, showing energy data for the selected participant.
 *
 * ## Routes
 * - `/`: Renders the `ParticipantSelector` component.
 * - `/participant/:participantId`: Renders the `Dashboard` component for the specified participant.
 *
 * ## Usage
 * This component is typically rendered at the root of the application:
 * ```tsx
 * import { AppRouter } from './router/AppRouter';
 * 
 * function App() {
 *   return <AppRouter />;
 * }
 * ```
 *
 * ## Notes
 * - The `BrowserRouter` component wraps the application to enable client-side routing.
 * - The `Routes` component defines the available routes and their corresponding components.
 * - The `:participantId` parameter in the `/participant/:participantId` route is used to dynamically load data for a specific participant.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { ParticipantSelector } from '../components/ParticipantSelector/ParticipantSelector';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/participant/:participantId" element={<Dashboard />} />
        <Route path="/" element={<ParticipantSelector />} />
      </Routes>
    </BrowserRouter>
  );
}
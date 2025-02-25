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
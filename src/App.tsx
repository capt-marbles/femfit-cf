import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import Program from './pages/Program';
import Log from './pages/Log';
import Measurements from './pages/Measurements';

export default function App() {
  return (
    <BrowserRouter>
      <WorkoutProvider>
        <div className="min-h-screen bg-white dark:bg-zinc-950">
          <Navigation />
          <main className="bottom-nav-spacer md:pt-0 md:pb-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/program" element={<Program />} />
              <Route path="/log" element={<Log />} />
              <Route path="/measurements" element={<Measurements />} />
              {/* Old bookmarks */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </WorkoutProvider>
    </BrowserRouter>
  );
}

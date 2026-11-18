/**
 * Declares the OpsIntel route tree and lazy-loads each large route module. The shared
 * shell stays mounted across screens while route content is suspended independently.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OperationsShell from './pages/OpsIntel/OperationsShell';
import './App.css';

const OverviewPage = lazy(() => import('./pages/OpsIntel/OverviewPage'));
const ApplicationDetailPage = lazy(() => import('./pages/OpsIntel/ApplicationDetailPage'));
const OnboardingPage = lazy(() => import('./pages/OpsIntel/OnboardingPage'));
const DomainsPage = lazy(() => import('./pages/OpsIntel/DomainsPage'));

/** Renders all application routes within one persistent navigation shell. */
function App() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading WOS...</div>}>
      <Routes>
        <Route element={<OperationsShell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/onboard" element={<OnboardingPage />} />
          <Route path="/domains" element={<DomainsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
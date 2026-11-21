import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { MotionConfig } from 'motion/react';
import { lazy, Suspense, type ReactNode } from 'react';
import { SessionProvider, useSession } from './lib/session';
import Landing from './pages/Landing';
import { Spinner } from './components/ui';

// The landing page stays light; Firebase and D3 load only once you sign in.
const SignIn = lazy(() => import('./pages/SignIn'));
const AppShell = lazy(() => import('./components/AppShell'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label="Loading…" />
    </div>
  );
}

function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();
  if (!session) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SessionProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route
                path="/app"
                element={
                  <RequireSession>
                    <AppShell />
                  </RequireSession>
                }
              >
                <Route index element={<Navigate to="network" replace />} />
                <Route path="network" element={<NetworkPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SessionProvider>
    </MotionConfig>
  );
}

import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { MotionConfig } from 'motion/react';
import { lazy, Suspense, type ReactNode } from 'react';
import { SessionProvider, useSession } from './lib/session';
import { ToastProvider } from './components/Toast';
import Landing from './pages/Landing';
import { Spinner } from './components/ui';

// The landing page stays light; Firebase and D3 load only once you sign in.
const SignIn = lazy(() => import('./pages/SignIn'));
const AppShell = lazy(() => import('./components/AppShell'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const AnalyticsLayout = lazy(() => import('./pages/analytics/AnalyticsLayout'));
const AnalyticsOverview = lazy(() => import('./pages/analytics/Overview'));
const Influence = lazy(() => import('./pages/analytics/Influence'));
const Activity = lazy(() => import('./pages/analytics/Activity'));
const Insights = lazy(() => import('./pages/analytics/Insights'));
const MeetingsLayout = lazy(() => import('./pages/meetings/MeetingsLayout'));
const MeetingsInbox = lazy(() => import('./pages/meetings/Inbox'));
const MeetingsYours = lazy(() => import('./pages/meetings/Yours'));
const MeetingsHistory = lazy(() => import('./pages/meetings/History'));
const LogMeeting = lazy(() => import('./pages/meetings/LogMeeting'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Applications = lazy(() => import('./pages/admin/Applications'));
const Members = lazy(() => import('./pages/admin/Members'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const Join = lazy(() => import('./pages/Join'));
const CreateNetwork = lazy(() => import('./pages/CreateNetwork'));

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label="Loading…" />
    </div>
  );
}

function RequireSession({ children }: { children: ReactNode }) {
  const { session, ready, signedOut } = useSession();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!session) {
    return signedOut ? <Navigate to="/" replace /> : <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SessionProvider>
        <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/join" element={<Join />} />
              <Route path="/create" element={<CreateNetwork />} />
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
                <Route path="meetings" element={<MeetingsLayout />}>
                  <Route index element={<MeetingsInbox />} />
                  <Route path="yours" element={<MeetingsYours />} />
                  <Route path="history" element={<MeetingsHistory />} />
                  <Route path="new" element={<LogMeeting />} />
                </Route>
                <Route path="profile" element={<Profile />} />
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<Applications />} />
                  <Route path="members" element={<Members />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="analytics" element={<AnalyticsLayout />}>
                  <Route index element={<AnalyticsOverview />} />
                  <Route path="influence" element={<Influence />} />
                  <Route path="activity" element={<Activity />} />
                  <Route path="insights" element={<Insights />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </ToastProvider>
      </SessionProvider>
    </MotionConfig>
  );
}

import { useMemo } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router';
import { useShell, type ShellContext } from '../../components/AppShell';
import { PageHeader, SubNav } from '../../components/layout';
import { analyticsInput, type AnalyticsInput } from '../../lib/analytics';

export interface AnalyticsContext extends ShellContext {
  input: AnalyticsInput;
}

export function useAnalytics() {
  return useOutletContext<AnalyticsContext>();
}

const TABS = [
  { to: '/app/analytics', label: 'Overview' },
  { to: '/app/analytics/influence', label: 'Influence' },
  { to: '/app/analytics/activity', label: 'Activity' },
  { to: '/app/analytics/insights', label: 'Insights' },
];

export default function AnalyticsLayout() {
  const shell = useShell();
  const location = useLocation();
  const isAdmin = shell.session.role === 'admin';
  const input = useMemo(
    () => analyticsInput(shell.data.entities, shell.data.meetings, shell.session.unityId),
    [shell.data, shell.session.unityId],
  );

  // "Overview" is about your own organisation, so admins start at Influence.
  if (isAdmin && location.pathname.replace(/\/$/, '') === '/app/analytics') {
    return <Navigate to="/app/analytics/influence" replace />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <PageHeader title="Analytics" description="Calculated from verified meetings only. Pending and disputed meetings don't count." />
      <SubNav items={isAdmin ? TABS.slice(1) : TABS} />
      <Outlet context={{ ...shell, input } satisfies AnalyticsContext} />
    </div>
  );
}

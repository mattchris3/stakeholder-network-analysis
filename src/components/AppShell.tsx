import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router';
import { withDemoApplicants } from '../data/demoApplicants';
import { loadUnity } from '../lib/data';
import { inbox } from '../lib/meetings';
import { createEntityRecord, createMeetingRecord, saveDecision, updateEntityRecord, updateUnityRecord } from '../lib/store';
import { useSession, type Session } from '../lib/session';
import type { Entity, Meeting, Unity, UnityData } from '../lib/types';
import { Badge, Button, Logo, Spinner } from './ui';

export interface ShellContext {
  session: Session;
  data: UnityData;
  /** Saves a new meeting, or this member's decision on one. Demo sessions keep it in memory. */
  saveMeeting: (meeting: Meeting, kind: 'create' | 'decision') => Promise<void>;
  /** Updates an organisation record (profile edits, admin decisions). */
  updateEntity: (id: string, patch: Partial<Entity>) => Promise<void>;
  /** Adds a new organisation record (applications). */
  addEntity: (entity: Entity) => Promise<void>;
  /** Updates the network's own settings. */
  updateUnity: (patch: Partial<Unity>) => Promise<void>;
}

export function useShell() {
  return useOutletContext<ShellContext>();
}

const NAV: Record<Session['role'], { to: string; label: string; badge?: 'verify' | 'applications' }[]> = {
  member: [
    { to: '/app/network', label: 'Network' },
    { to: '/app/meetings', label: 'Meetings', badge: 'verify' },
    { to: '/app/analytics', label: 'Analytics' },
    { to: '/app/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/app/network', label: 'Network' },
    { to: '/app/analytics/influence', label: 'Analytics' },
    { to: '/app/admin', label: 'Admin', badge: 'applications' },
  ],
};

export default function AppShell() {
  const { session, signOut } = useSession();
  const location = useLocation();
  const [data, setData] = useState<UnityData | null>(null);

  useEffect(() => {
    if (!session) return;
    let live = true;
    loadUnity(session.unityId).then((d) => {
      if (!live) return;
      setData(session.demo && session.role === 'admin' ? withDemoApplicants(d, session.unityId) : d);
    });
    return () => { live = false; };
  }, [session]);

  const saveMeeting = useCallback(
    async (meeting: Meeting, kind: 'create' | 'decision') => {
      if (!session) return;
      if (!session.demo) {
        if (kind === 'create') await createMeetingRecord(meeting);
        else await saveDecision(meeting, session.orgId);
      }
      setData((d) =>
        d && {
          ...d,
          meetings: d.meetings.some((m) => m.id === meeting.id)
            ? d.meetings.map((m) => (m.id === meeting.id ? meeting : m))
            : [...d.meetings, meeting],
        },
      );
    },
    [session],
  );

  const updateEntity = useCallback(
    async (id: string, patch: Partial<Entity>) => {
      if (!session) return;
      if (!session.demo) await updateEntityRecord(id, patch);
      setData((d) => d && { ...d, entities: d.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    },
    [session],
  );

  const addEntity = useCallback(
    async (entity: Entity) => {
      if (!session) return;
      if (!session.demo) await createEntityRecord(entity);
      setData((d) => d && { ...d, entities: [...d.entities, entity] });
    },
    [session],
  );

  const updateUnity = useCallback(
    async (patch: Partial<Unity>) => {
      if (!session) return;
      if (!session.demo) await updateUnityRecord(session.unityId, patch);
      setData((d) => d && { ...d, unity: d.unity && { ...d.unity, ...patch } });
    },
    [session],
  );

  const badges = useMemo(
    () => ({
      verify: data && session ? inbox(data.meetings, session.orgId).toVerify.length : 0,
      applications: data ? data.entities.filter((e) => e.approval === 'pending').length : 0,
    }),
    [data, session],
  );

  if (!session) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Unity home" className="shrink-0">
            <Logo />
          </Link>
          <span className="hidden truncate text-sm text-ink-muted md:block">
            / {data?.unity?.name ?? session.unityId}
          </span>
          <nav className="ml-1 flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Main">
            {NAV[session.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium transition-colors ${
                    isActive ? 'bg-sunken text-ink' : 'text-ink-soft hover:text-ink'
                  }`
                }
              >
                {item.label}
                {item.badge && badges[item.badge] > 0 && (
                  <span className="num ml-1.5 rounded-full bg-accent px-1.5 text-[11px] leading-[18px] text-white" aria-label={`${badges[item.badge]} waiting`}>
                    {badges[item.badge]}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {session.demo && (
              <span className="hidden sm:inline-flex">
                <Badge tone="accent">Demo mode</Badge>
              </span>
            )}
            <span className="hidden h-8 items-center rounded-md border border-line px-2.5 text-[13px] font-medium sm:inline-flex">
              {session.orgName}
            </span>
            <Button
              size="sm"
              variant="ghost"
onClick={signOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {data ? (
          // Keyed by section: each section fades in on arrival. No exit animation, because
          // an exiting <Outlet> would render the *new* route while it fades out.
          <motion.div
            key={location.pathname.split('/').slice(0, 3).join('/')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            <Outlet context={{ session, data, saveMeeting, updateEntity, addEntity, updateUnity } satisfies ShellContext} />
          </motion.div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Spinner label="Loading your network…" />
          </div>
        )}
      </main>
    </div>
  );
}

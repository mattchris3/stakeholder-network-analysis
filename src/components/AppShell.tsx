import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { loadUnity } from '../lib/data';
import { useSession, type Session } from '../lib/session';
import type { UnityData } from '../lib/types';
import { Badge, Button, Logo, Spinner } from './ui';

export interface ShellContext {
  session: Session;
  data: UnityData;
}

export function useShell() {
  return useOutletContext<ShellContext>();
}

const NAV = [{ to: '/app/network', label: 'Network' }];

export default function AppShell() {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<UnityData | null>(null);

  useEffect(() => {
    if (!session) return;
    let live = true;
    loadUnity(session.unityId).then((d) => live && setData(d));
    return () => { live = false; };
  }, [session]);

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
          <nav className="ml-2 flex items-center gap-1" aria-label="Main">
            {NAV.map((item) => (
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
              onClick={() => {
                signOut();
                navigate('/');
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {data ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col"
            >
              <Outlet context={{ session, data } satisfies ShellContext} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Spinner label="Loading your network…" />
          </div>
        )}
      </main>
    </div>
  );
}

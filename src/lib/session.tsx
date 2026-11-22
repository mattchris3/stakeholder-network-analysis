import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { sessionFor, signInWithEmail, signOut as authSignOut, startAnonymous } from './auth';
import { clearUnityCache } from './data';
import { auth } from './firebase';

export type Role = 'member' | 'admin';

export interface Session {
  role: Role;
  unityId: string;
  orgId: string;
  orgName: string;
  /** Demo sessions are anonymous: changes stay in memory and are never written. */
  demo: boolean;
  email?: string;
}

export const DEMO = { unityId: 'UNITY-GLOBHEALTH-2025', orgId: 'WHO-001', orgName: 'WHO' } as const;
export const DEMO_ADMIN = { unityId: 'UNITY-GLOBHEALTH-2025', orgId: 'ADMIN', orgName: 'Network admin' } as const;

// Which demo role an anonymous visitor picked. Per tab, like the demo's changes.
const DEMO_KEY = 'unity.demo';

function demoSession(role: Role): Session {
  return role === 'admin' ? { role, ...DEMO_ADMIN, demo: true } : { role, ...DEMO, demo: true };
}

function storedDemoRole(): Role | null {
  try {
    const v = sessionStorage.getItem(DEMO_KEY);
    return v === 'member' || v === 'admin' ? v : null;
  } catch {
    return null;
  }
}

function storeDemoRole(role: Role | null) {
  try {
    if (role) sessionStorage.setItem(DEMO_KEY, role);
    else sessionStorage.removeItem(DEMO_KEY);
  } catch {
    /* private mode: the session lives in memory */
  }
}

interface SessionContext {
  session: Session | null;
  /** False until Firebase has said who is signed in. */
  ready: boolean;
  /** True after an explicit sign-out, so guards send people home rather than to sign-in. */
  signedOut: boolean;
  startDemo: (role: Role) => Promise<void>;
  signIn: (email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  /** Re-reads the signed-in account's profile (after joining or creating a network). */
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const role = !auth ? storedDemoRole() : null;
    return role ? demoSession(role) : null;
  });
  const [ready, setReady] = useState(!auth);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSession(null);
      } else if (user.isAnonymous) {
        const role = storedDemoRole();
        setSession(role ? demoSession(role) : null);
      } else {
        try {
          setSession(await sessionFor(user));
        } catch {
          // e.g. an application still waiting for approval: signed in, but no session.
          setSession(null);
        }
      }
      setReady(true);
    });
  }, []);

  const startDemo = useCallback(async (role: Role) => {
    clearUnityCache();
    storeDemoRole(role);
    try {
      await startAnonymous();
    } catch (e) {
      // Anonymous sign-in switched off or offline: the demo still runs on the bundled data.
      console.warn('Demo without a Firebase session:', e);
    }
    setSignedOut(false);
    setSession(demoSession(role));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Another account may have changed the network in this tab; read it fresh.
    clearUnityCache();
    storeDemoRole(null);
    const s = await signInWithEmail(email, password);
    setSignedOut(false);
    setSession(s);
    return s;
  }, []);

  const signOut = useCallback(async () => {
    clearUnityCache();
    storeDemoRole(null);
    setSignedOut(true);
    setSession(null);
    await authSignOut();
  }, []);

  const refresh = useCallback(async () => {
    const user = auth?.currentUser;
    if (user && !user.isAnonymous) {
      setSession(await sessionFor(user));
      setSignedOut(false);
    }
  }, []);

  const value = useMemo(
    () => ({ session, ready, signedOut, startDemo, signIn, signOut, refresh }),
    [session, ready, signedOut, startDemo, signIn, signOut, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

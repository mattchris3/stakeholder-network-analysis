import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Session {
  role: 'member';
  unityId: string;
  orgId: string;
  orgName: string;
  demo: boolean;
}

export const DEMO = { unityId: 'UNITY-GLOBHEALTH-2025', orgId: 'WHO-001', orgName: 'WHO' } as const;

const KEY = 'unity.session';

function read(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

interface SessionContext {
  session: Session | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(read);

  const signIn = useCallback((s: Session) => {
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: keep in memory */ }
    setSession(s);
  }, []);

  const signOut = useCallback(() => {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

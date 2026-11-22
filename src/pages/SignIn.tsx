import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Logo } from '../components/ui';
import { clearUnityCache, loadUnity } from '../lib/data';
import { DEMO, useSession } from '../lib/session';
import { useStartDemo } from '../lib/useDemo';

export default function SignIn() {
  const { signIn } = useSession();
  const startDemo = useStartDemo();
  const startAdminDemo = useStartDemo('admin');
  const navigate = useNavigate();
  const location = useLocation();
  const [unityId, setUnityId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const unity = unityId.trim();
    const member = memberId.trim();
    if (!unity || !member) {
      setError('Enter both your network ID and your member ID.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      clearUnityCache();
      const data = await loadUnity(unity);
      const entity = data.entities.find((x) => x.id === member);
      if (!entity) {
        setError("We couldn't find that member in that network. Check both IDs.");
      } else if (entity.approval !== 'approved' || entity.status !== 'active') {
        setError("Your organisation hasn't been approved yet. Ask your network's admin.");
      } else {
        const isDemo = unity === DEMO.unityId;
        signIn({ role: 'member', unityId: unity, orgId: entity.id, orgName: entity.name, demo: isDemo });
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from ?? '/app/network');
      }
    } catch {
      setError("Couldn't reach the network. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link to="/" aria-label="Unity home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your network</h1>
          <p className="mt-2 text-ink-soft">Use the IDs your network's admin gave you.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="unityId" className="mb-1.5 block text-sm font-medium">
                Network ID
              </label>
              <input
                id="unityId"
                className="field num"
                placeholder="UNITY-GLOBHEALTH-2025"
                autoComplete="organization"
                value={unityId}
                onChange={(e) => { setUnityId(e.target.value); setError(null); }}
              />
            </div>
            <div>
              <label htmlFor="memberId" className="mb-1.5 block text-sm font-medium">
                Member ID
              </label>
              <input
                id="memberId"
                className="field num"
                placeholder="WHO-001"
                autoComplete="username"
                value={memberId}
                onChange={(e) => { setMemberId(e.target.value); setError(null); }}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={startDemo}>Demo as a member</Button>
            <Button onClick={startAdminDemo}>Demo as admin</Button>
          </div>
          <p className="mt-3 text-center text-sm text-ink-muted">Opens the sample network. Nothing is saved.</p>
          <p className="mt-8 text-center text-sm text-ink-soft">
            New to a network?{' '}
            <Link to="/join" className="font-medium text-accent underline-offset-4 hover:underline">
              Apply to join
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

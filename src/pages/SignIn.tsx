import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Logo } from '../components/ui';
import { friendlyError, resetPassword } from '../lib/auth';
import { authEnabled } from '../lib/firebase';
import { useSession } from '../lib/session';
import { useStartDemo } from '../lib/useDemo';

export default function SignIn() {
  const { signIn } = useSession();
  const startDemo = useStartDemo();
  const startAdminDemo = useStartDemo('admin');
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await signIn(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? (session.role === 'admin' ? '/app/admin' : '/app/network'));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setError(null);
    if (!email.trim()) {
      setError('Enter your email first, then choose "Forgot password".');
      return;
    }
    try {
      await resetPassword(email);
    } catch {
      /* Don't reveal whether the address has an account. */
    }
    setNotice(`If ${email.trim()} has an account, a reset link is on its way.`);
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
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-ink-soft">Members and network admins use the same sign-in.</p>

          {authEnabled ? (
            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  className="field"
                  placeholder="name@organisation.org"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <button type="button" onClick={onReset} className="text-xs text-ink-muted hover:text-ink">
                    Forgot password
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  className="field"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                />
              </div>
              {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
              {notice && <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-ink">{notice}</p>}
              <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <p className="mt-8 rounded-lg bg-sunken px-3 py-2.5 text-sm text-ink-soft">
              Accounts aren't set up on this copy of the app. The demo below shows every feature.
            </p>
          )}

          <div className="my-8 flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" />
            or try it without an account
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={startDemo}>Demo as a member</Button>
            <Button onClick={startAdminDemo}>Demo as admin</Button>
          </div>
          <p className="mt-3 text-center text-sm text-ink-muted">Opens the sample network. Nothing is saved.</p>

          <div className="mt-10 space-y-2 border-t border-line pt-6 text-center text-sm text-ink-soft">
            <p>
              Your organisation was invited?{' '}
              <Link to="/join" className="font-medium text-accent underline-offset-4 hover:underline">Apply to join</Link>
            </p>
            <p>
              Starting a new network?{' '}
              <Link to="/create" className="font-medium text-accent underline-offset-4 hover:underline">Create one</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { get, ref } from 'firebase/database';
import { Button, ButtonLink, Logo } from '../components/ui';
import { createNetwork, ensureUser, friendlyError } from '../lib/auth';
import { authEnabled, database } from '../lib/firebase';
import { useSession } from '../lib/session';
import type { Unity } from '../lib/types';

function Field({ id, text, error, hint, children }: { id: string; text: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{text}</label>
      {children}
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

/** "Global Health Network" → "UNITY-GLOBALHEALTH-2026" */
function networkId(name: string) {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter((w) => w && w !== 'NETWORK' && w !== 'THE');
  return `UNITY-${words.join('').slice(0, 14) || 'NETWORK'}-${new Date().getFullYear()}`;
}

/** Seven characters without look-alikes (no 0/O, 1/I). */
function accessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function CreateNetwork() {
  const { refresh } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [area, setArea] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Unity | null>(null);

  function addArea() {
    const a = area.trim().replace(/\s+/g, ' ');
    if (a && !areas.some((x) => x.toLowerCase() === a.toLowerCase())) setAreas([...areas, a]);
    setArea('');
  }
  const onAreaKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addArea();
    }
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (name.trim().length < 3) found.name = 'Give your network a name.';
    if (description.trim().length < 20) found.description = 'Say in a sentence or two what the network is for.';
    if (areas.length < 2) found.areas = 'Add at least two focus areas. Press Enter after each.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = 'Enter the email you will sign in with.';
    if (password.length < 8) found.password = 'Use at least 8 characters.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await ensureUser();
      let id = networkId(name);
      // Avoid clashing with an existing network of the same name.
      for (let n = 2; (await get(ref(database, `unities/${id}`))).exists(); n++) id = `${networkId(name)}-${n}`;
      const unity: Unity = {
        unityId: id,
        name: name.trim(),
        description: description.trim(),
        focusAreas: areas,
        accessCode: accessCode(),
        acceptingMembers: true,
        created: new Date().toISOString().slice(0, 10),
      };
      await createNetwork(email, password, unity);
      await refresh();
      setCreated(unity);
    } catch (err) {
      setErrors({ email: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Unity home"><Logo /></Link>
        <ButtonLink to="/sign-in" size="sm" variant="ghost">Sign in</ButtonLink>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-[6vh] pb-16">
        <AnimatePresence mode="wait">
          {!authEnabled ? (
            <motion.div key="off" className="w-full max-w-sm text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-2xl font-semibold tracking-tight">Create a network</h1>
              <p className="mt-2 text-ink-soft">Accounts aren't set up on this copy of the app. Try the admin demo to see how running a network works.</p>
              <ButtonLink to="/sign-in" className="mt-6">Back to sign in</ButtonLink>
            </motion.div>
          ) : created ? (
            <motion.div key="done" className="w-full max-w-md" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700" aria-hidden="true">✓</div>
              <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">{created.name} is ready</h1>
              <p className="mt-2 text-center text-ink-soft">Send these to the organisations you want to invite. They apply at /join.</p>
              <dl className="card mt-6 divide-y divide-line">
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-ink-muted">Network ID</dt>
                  <dd className="num text-sm font-medium">{created.unityId}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="text-sm text-ink-muted">Access code</dt>
                  <dd className="num text-lg font-medium">{created.accessCode}</dd>
                </div>
              </dl>
              <Button variant="primary" className="mt-6 w-full" onClick={() => navigate('/app/admin')}>Open your network</Button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} noValidate className="w-full max-w-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-semibold tracking-tight">Create a network</h1>
              <p className="mt-2 text-ink-soft">You'll be its admin: you approve members and set the focus areas they describe their work with.</p>
              <div className="card mt-6 space-y-4 p-5">
                <Field id="name" text="Network name" error={errors.name}>
                  <input id="name" className="field" placeholder="Northern Ireland Energy Partnership" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field id="description" text="What it's for" error={errors.description}>
                  <textarea id="description" rows={3} className="field h-auto py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
                <Field id="area" text="Focus areas" error={errors.areas} hint="Press Enter after each one. Members pick from this list.">
                  <input id="area" className="field" placeholder="Offshore wind" value={area} onChange={(e) => setArea(e.target.value)} onKeyDown={onAreaKey} onBlur={addArea} />
                </Field>
                {areas.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {areas.map((a) => (
                      <li key={a}>
                        <button type="button" onClick={() => setAreas(areas.filter((x) => x !== a))} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-2.5 text-[13px] text-accent-ink" aria-label={`Remove ${a}`}>
                          {a} <span aria-hidden="true">×</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  <Field id="email" text="Your email" error={errors.email}>
                    <input id="email" type="email" autoComplete="email" className="field" placeholder="you@organisation.org" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field id="password" text="Choose a password" error={errors.password}>
                    <input id="password" type="password" autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Creating…' : 'Create network'}</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

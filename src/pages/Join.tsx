import { useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router';
import { Button, ButtonLink, Logo } from '../components/ui';
import { clearUnityCache, loadUnity } from '../lib/data';
import { label, SECTOR_COLORS } from '../lib/sectors';
import { DEMO } from '../lib/session';
import { createEntityRecord } from '../lib/store';
import type { Entity, Unity } from '../lib/types';

const TYPES = ['ngo', 'un-agency', 'government', 'intergovernmental', 'academic', 'corporation', 'private-foundation'];
const SIZES = ['small', 'medium', 'large'];
const REGIONS = ['global', 'regional', 'national'];
const FUNDING = ['implementer', 'research', 'donor'];

interface Draft {
  name: string;
  fullName: string;
  sector: string;
  type: string;
  size: string;
  region: string;
  fundingType: string;
  location: string;
  description: string;
  focusAreas: string[];
}
const EMPTY: Draft = { name: '', fullName: '', sector: '', type: '', size: '', region: '', fundingType: '', location: '', description: '', focusAreas: [] };

function Field({ id, text, error, children }: { id: string; text: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{text}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

function Select({ id, value, options, onChange }: { id: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose…</option>
      {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
    </select>
  );
}

/** Short, readable and unique enough across all networks: WHO → WHO-K3F9. */
function newMemberId(name: string) {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 12) || 'ORG';
  return `${slug}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export default function Join() {
  const [step, setStep] = useState<'code' | 'details' | 'done'>('code');
  const [unityId, setUnityId] = useState('');
  const [code, setCode] = useState('');
  const [unity, setUnity] = useState<Unity | null>(null);
  const [existing, setExisting] = useState<Entity[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft | 'code', string>>>({});
  const [busy, setBusy] = useState(false);
  const [memberId, setMemberId] = useState('');
  const isDemo = unity?.unityId === DEMO.unityId;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function checkCode(e: FormEvent) {
    e.preventDefault();
    if (!unityId.trim() || !code.trim()) return setErrors({ code: 'Enter the network ID and access code you were given.' });
    setBusy(true);
    try {
      clearUnityCache();
      const data = await loadUnity(unityId.trim());
      if (!data.unity || data.unity.accessCode?.toUpperCase() !== code.trim().toUpperCase()) {
        setErrors({ code: "That network ID and access code don't match. Check both with the network's admin." });
      } else if (data.unity.acceptingMembers === false) {
        setErrors({ code: "This network isn't accepting new members right now." });
      } else {
        setUnity(data.unity);
        setExisting(data.entities);
        setErrors({});
        setStep('details');
      }
    } catch {
      setErrors({ code: "Couldn't reach the network. Try again in a moment." });
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: typeof errors = {};
    if (!draft.name.trim()) found.name = 'Enter a short name, like WHO.';
    if (!draft.fullName.trim()) found.fullName = 'Enter the full name.';
    for (const k of ['sector', 'type', 'size', 'region', 'fundingType'] as const) if (!draft[k]) found[k] = 'Choose one.';
    if (draft.description.trim().length < 20) found.description = 'Describe your organisation in a sentence or two.';
    if (draft.focusAreas.length === 0) found.focusAreas = 'Choose at least one focus area.';
    const clash = existing.find(
      (x) => x.name.toLowerCase() === draft.name.trim().toLowerCase() || (x.fullName ?? '').toLowerCase() === draft.fullName.trim().toLowerCase(),
    );
    if (clash) found.name = `${clash.fullName ?? clash.name} is already in this network.`;
    setErrors(found);
    if (Object.keys(found).length) return;

    const entity: Entity = {
      id: newMemberId(draft.name),
      unityId: unity!.unityId,
      name: draft.name.trim(),
      fullName: draft.fullName.trim(),
      sector: draft.sector,
      type: draft.type,
      size: draft.size,
      region: draft.region,
      fundingType: draft.fundingType,
      location: draft.location.trim(),
      description: draft.description.trim(),
      focusAreas: draft.focusAreas,
      status: 'inactive',
      approval: 'pending',
      appliedDate: new Date().toISOString().slice(0, 10),
    };
    setBusy(true);
    try {
      // The demo network is shared, so demo applications aren't saved.
      if (!isDemo) await createEntityRecord(entity);
      setMemberId(entity.id);
      setStep('done');
    } catch {
      setErrors({ description: "Couldn't send your application. Try again." });
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
          {step === 'code' && (
            <motion.form key="code" onSubmit={checkCode} noValidate className="w-full max-w-sm space-y-4"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }}>
              <div>
                <p className="eyebrow">Step 1 of 2</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">Join a network</h1>
                <p className="mt-2 text-ink-soft">Enter the network ID and access code from the network's admin.</p>
              </div>
              <Field id="unityId" text="Network ID">
                <input id="unityId" className="field num" placeholder="UNITY-GLOBHEALTH-2025" value={unityId} onChange={(e) => setUnityId(e.target.value)} />
              </Field>
              <Field id="code" text="Access code" error={errors.code}>
                <input id="code" className="field num" placeholder="GHU2534" value={code} onChange={(e) => setCode(e.target.value)} />
              </Field>
              <Button type="submit" variant="primary" className="w-full" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</Button>
              <p className="text-center text-sm text-ink-muted">
                Trying it out? Use <span className="num">UNITY-GLOBHEALTH-2025</span> and <span className="num">GHU2534</span>.
              </p>
            </motion.form>
          )}

          {step === 'details' && unity && (
            <motion.form key="details" onSubmit={submit} noValidate className="w-full max-w-2xl"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="eyebrow">Step 2 of 2</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Apply to {unity.name}</h1>
              <p className="mt-2 text-ink-soft">The network's admin reviews every application.</p>
              {isDemo && (
                <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-ink">
                  This is the shared demo network, so your application won't be saved.
                </p>
              )}
              <div className="card mt-6 space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                  <Field id="name" text="Short name" error={errors.name}>
                    <input id="name" className="field" placeholder="WHO" value={draft.name} onChange={(e) => set('name', e.target.value)} />
                  </Field>
                  <Field id="fullName" text="Full name" error={errors.fullName}>
                    <input id="fullName" className="field" placeholder="World Health Organization" value={draft.fullName} onChange={(e) => set('fullName', e.target.value)} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field id="sector" text="Sector" error={errors.sector}><Select id="sector" value={draft.sector} options={Object.keys(SECTOR_COLORS)} onChange={(v) => set('sector', v)} /></Field>
                  <Field id="type" text="Type" error={errors.type}><Select id="type" value={draft.type} options={TYPES} onChange={(v) => set('type', v)} /></Field>
                  <Field id="fundingType" text="Funding role" error={errors.fundingType}><Select id="fundingType" value={draft.fundingType} options={FUNDING} onChange={(v) => set('fundingType', v)} /></Field>
                  <Field id="size" text="Size" error={errors.size}><Select id="size" value={draft.size} options={SIZES} onChange={(v) => set('size', v)} /></Field>
                  <Field id="region" text="Reach" error={errors.region}><Select id="region" value={draft.region} options={REGIONS} onChange={(v) => set('region', v)} /></Field>
                  <Field id="location" text="Based in">
                    <input id="location" className="field" placeholder="Geneva, Switzerland" value={draft.location} onChange={(e) => set('location', e.target.value)} />
                  </Field>
                </div>
                <Field id="description" text="About your organisation" error={errors.description}>
                  <textarea id="description" rows={4} className="field h-auto py-2" value={draft.description} onChange={(e) => set('description', e.target.value)} />
                </Field>
                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium">Focus areas</legend>
                  <div className="flex flex-wrap gap-2">
                    {(unity.focusAreas ?? []).map((a) => {
                      const on = draft.focusAreas.includes(a);
                      return (
                        <button key={a} type="button" aria-pressed={on}
                          onClick={() => set('focusAreas', on ? draft.focusAreas.filter((x) => x !== a) : [...draft.focusAreas, a])}
                          className={`h-8 rounded-full border px-3 text-[13px] transition-colors ${on ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink-soft hover:text-ink'}`}>
                          {a}
                        </button>
                      );
                    })}
                  </div>
                  {errors.focusAreas && <p className="mt-1.5 text-xs text-danger">{errors.focusAreas}</p>}
                </fieldset>
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <Button onClick={() => setStep('code')}>Back</Button>
                <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Sending…' : 'Send application'}</Button>
              </div>
            </motion.form>
          )}

          {step === 'done' && (
            <motion.div key="done" className="w-full max-w-sm text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-700" aria-hidden="true">✓</div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">Application sent</h1>
              <p className="mt-2 text-ink-soft">
                {isDemo
                  ? "In a real network, the admin would now review it. Nothing was saved."
                  : `${unity?.name}'s admin will review it. Once approved, sign in with your member ID:`}
              </p>
              {!isDemo && <p className="num mt-3 rounded-lg bg-sunken py-2 text-lg font-medium">{memberId}</p>}
              <ButtonLink to="/" className="mt-6">Back to home</ButtonLink>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

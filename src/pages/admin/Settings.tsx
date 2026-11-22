import { useState, type FormEvent } from 'react';
import { ConfirmDialog, Section } from '../../components/layout';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/ui';
import { useAdmin } from './AdminLayout';

export default function Settings() {
  const { data, updateUnity } = useAdmin();
  const toast = useToast();
  const areas = data.unity?.focusAreas ?? [];
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const usage = (area: string) => data.entities.filter((e) => e.approval === 'approved' && (e.focusAreas ?? []).includes(area)).length;

  async function save(focusAreas: string[], message: string) {
    setBusy(true);
    try {
      await updateUnity({ focusAreas });
      toast(message);
    } catch {
      toast("Couldn't save. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    const area = draft.trim().replace(/\s+/g, ' ');
    if (!area) return setError('Enter a focus area.');
    if (areas.some((a) => a.toLowerCase() === area.toLowerCase())) return setError('That focus area already exists.');
    await save([...areas, area], `Added ${area}`);
    setDraft('');
  }

  async function toggleAccepting() {
    setBusy(true);
    try {
      const next = data.unity?.acceptingMembers === false;
      await updateUnity({ acceptingMembers: next });
      toast(next ? 'Now accepting applications' : 'Applications paused');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Section
        title="Focus areas"
        description="The vocabulary members describe their work with. Bridges and gaps are found by comparing these, so the same analytics work for any sector."
        flush
      >
        <form onSubmit={add} className="flex gap-2 border-b border-line-soft p-4 sm:px-5" noValidate>
          <div className="flex-1">
            <input
              className="field h-9"
              placeholder="Mental health"
              aria-label="New focus area"
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(null); }}
            />
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          </div>
          <Button type="submit" variant="primary" disabled={busy}>Add</Button>
        </form>
        <ul className="divide-y divide-line-soft">
          {areas.map((a) => (
            <li key={a} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <span className="flex-1 text-sm">{a}</span>
              <span className="num text-xs text-ink-muted">{usage(a)} members</span>
              <Button size="sm" variant="ghost" onClick={() => setRemoving(a)}>Remove</Button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Membership">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Network</dt>
            <dd className="text-right font-medium">{data.unity?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Network ID</dt>
            <dd className="num">{data.unity?.unityId}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-muted">Access code</dt>
            <dd className="flex items-center gap-2">
              <span className="num rounded-md bg-sunken px-2 py-0.5 font-medium">{data.unity?.accessCode ?? '—'}</span>
              {data.unity?.accessCode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard?.writeText(data.unity!.accessCode!).then(() => toast('Access code copied'))}
                >
                  Copy
                </Button>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Organisations apply with the network ID and access code, then wait for your approval.
        </p>
        <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line px-3 py-2.5">
          <span className="text-sm">Accept new applications</span>
          <input
            type="checkbox"
            role="switch"
            className="size-4 accent-accent"
            checked={data.unity?.acceptingMembers !== false}
            disabled={busy}
            onChange={toggleAccepting}
          />
        </label>
      </Section>

      <ConfirmDialog
        open={removing !== null}
        title={`Remove "${removing}"?`}
        body={
          removing && usage(removing) > 0
            ? `${usage(removing)} members list it. They keep it on their profiles, but no one new can choose it.`
            : 'No members use it.'
        }
        confirmLabel="Remove"
        tone="danger"
        busy={busy}
        onConfirm={async () => {
          if (!removing) return;
          await save(areas.filter((a) => a !== removing), `Removed ${removing}`);
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

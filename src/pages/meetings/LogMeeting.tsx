import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Section } from '../../components/layout';
import { useToast } from '../../components/Toast';
import { Button, Dot } from '../../components/ui';
import {
  MEETING_FORMATS,
  MEETING_TYPES,
  createMeeting,
  validateDraft,
  type DraftErrors,
  type MeetingDraft,
} from '../../lib/meetings';
import { label, sectorColor } from '../../lib/sectors';
import { useMeetings } from './MeetingsLayout';

const EMPTY: MeetingDraft = {
  title: '',
  date: '',
  type: '',
  format: '',
  location: '',
  purpose: '',
  outcome: '',
  participants: [],
};

function Field({ id, label: text, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {text}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export default function LogMeeting() {
  const { data, session, saveMeeting } = useMeetings();
  const toast = useToast();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<MeetingDraft>(EMPTY);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const others = useMemo(
    () =>
      data.entities
        .filter((e) => e.id !== session.orgId && e.status === 'active' && e.approval === 'approved')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.entities, session.orgId],
  );
  const shown = others.filter((e) => {
    const q = search.trim().toLowerCase();
    return !q || e.name.toLowerCase().includes(q) || (e.fullName ?? '').toLowerCase().includes(q);
  });

  const set = <K extends keyof MeetingDraft>(key: K, value: MeetingDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const toggle = (id: string) =>
    set('participants', draft.participants.includes(id) ? draft.participants.filter((p) => p !== id) : [...draft.participants, id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateDraft(draft, today);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      await saveMeeting(createMeeting(draft, session.orgId, session.unityId), 'create');
      toast(`Logged. ${draft.participants.length === 1 ? 'The other participant has' : `${draft.participants.length} participants have`} been asked to verify it.`);
      navigate('/app/meetings/yours');
    } catch {
      toast("Couldn't save the meeting. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  }

  const err = (k: keyof MeetingDraft) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-error` } : {});
  const fieldClass = (k: keyof MeetingDraft) => `field ${errors[k] ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}`;

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Section title="What happened" description="Only log meetings that have already taken place.">
        <div className="space-y-4">
          <Field id="title" label="Title" error={errors.title}>
            <input id="title" className={fieldClass('title')} placeholder="Quarterly health review" value={draft.title} onChange={(e) => set('title', e.target.value)} {...err('title')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="date" label="Date" error={errors.date}>
              <input id="date" type="date" max={today} className={fieldClass('date')} value={draft.date} onChange={(e) => set('date', e.target.value)} {...err('date')} />
            </Field>
            <Field id="type" label="Type" error={errors.type}>
              <select id="type" className={fieldClass('type')} value={draft.type} onChange={(e) => set('type', e.target.value)} {...err('type')}>
                <option value="">Choose…</option>
                {MEETING_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </select>
            </Field>
            <Field id="format" label="Format" error={errors.format}>
              <select id="format" className={fieldClass('format')} value={draft.format} onChange={(e) => set('format', e.target.value)} {...err('format')}>
                <option value="">Choose…</option>
                {MEETING_FORMATS.map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </select>
            </Field>
          </div>
          <Field id="location" label="Location" error={errors.location}>
            <input id="location" className={fieldClass('location')} placeholder="Geneva, Switzerland" value={draft.location} onChange={(e) => set('location', e.target.value)} {...err('location')} />
          </Field>
          <Field id="purpose" label="Purpose" error={errors.purpose} hint="Why you met.">
            <textarea id="purpose" rows={3} className={`${fieldClass('purpose')} h-auto py-2`} value={draft.purpose} onChange={(e) => set('purpose', e.target.value)} {...err('purpose')} />
          </Field>
          <Field id="outcome" label="Outcome" error={errors.outcome} hint="What was agreed or decided.">
            <textarea id="outcome" rows={3} className={`${fieldClass('outcome')} h-auto py-2`} value={draft.outcome} onChange={(e) => set('outcome', e.target.value)} {...err('outcome')} />
          </Field>
        </div>
      </Section>

      <div className="flex flex-col gap-4">
        <Section
          title="Who took part"
          description={`You're included as the host. ${draft.participants.length} other ${draft.participants.length === 1 ? 'organisation' : 'organisations'} selected.`}
          flush
        >
          <div className="border-b border-line-soft p-3">
            <input
              id="participants"
              className={`${fieldClass('participants')} h-9`}
              placeholder="Find an organisation"
              aria-label="Find an organisation"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              {...err('participants')}
            />
            {errors.participants && <p id="participants-error" className="mt-1.5 text-xs text-danger">{errors.participants}</p>}
          </div>
          <ul className="max-h-[360px] overflow-y-auto p-2">
            {shown.map((e) => {
              const on = draft.participants.includes(e.id);
              return (
                <li key={e.id}>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors ${on ? 'bg-accent-soft' : 'hover:bg-sunken'}`}>
                    <input type="checkbox" className="size-4 accent-accent" checked={on} onChange={() => toggle(e.id)} />
                    <Dot color={sectorColor(e.sector ?? '')} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.name}</span>
                      <span className="block truncate text-xs text-ink-muted">{e.fullName}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Section>
        <div className="flex justify-end gap-2">
          <Button onClick={() => { setDraft(EMPTY); setErrors({}); }}>Clear</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Log meeting'}
          </Button>
        </div>
      </div>
    </form>
  );
}

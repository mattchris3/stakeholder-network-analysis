import { useState } from 'react';
import { motion } from 'motion/react';
import { useShell } from '../components/AppShell';
import { EmptyState, PageHeader, Section } from '../components/layout';
import { useToast } from '../components/Toast';
import { Badge, Button } from '../components/ui';
import { formatDate } from '../lib/format';
import { label, sectorColor } from '../lib/sectors';

export default function Profile() {
  const { session, data, updateEntity } = useShell();
  const toast = useToast();
  const org = data.entities.find((e) => e.id === session.orgId);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(org?.description ?? '');
  const [busy, setBusy] = useState(false);

  if (!org) {
    return (
      <div className="p-6">
        <EmptyState title="We couldn't find your organisation" body="Ask your network's admin to check your membership." />
      </div>
    );
  }

  const vocabulary = data.unity?.focusAreas ?? [];
  const mine = org.focusAreas ?? [];
  const members = data.entities.filter((e) => e.status === 'active' && e.approval === 'approved').length;

  async function save(patch: Parameters<typeof updateEntity>[1], message: string) {
    setBusy(true);
    try {
      await updateEntity(org!.id, patch);
      toast(message);
      return true;
    } catch {
      toast("Couldn't save. Try again.", 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  const toggleArea = (area: string) =>
    save(
      { focusAreas: mine.includes(area) ? mine.filter((a) => a !== area) : [...mine, area] },
      mine.includes(area) ? `Removed ${area}` : `Added ${area}`,
    );

  const details: [string, string | number | undefined][] = [
    ['Member ID', org.id],
    ['Sector', label(org.sector)],
    ['Type', label(org.type)],
    ['Funding role', label(org.fundingType)],
    ['Size', label(org.size)],
    ['Region', label(org.region)],
    ['Based in', org.location],
    ['Founded', org.founded],
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <PageHeader title="Profile" description="How your organisation appears to the rest of the network." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-start gap-4 border-b border-line px-5 py-5">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-xl text-lg font-semibold text-white"
                style={{ background: sectorColor(org.sector ?? '') }}
                aria-hidden="true"
              >
                {org.name.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg leading-snug font-semibold">{org.fullName ?? org.name}</h2>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge>{label(org.sector)}</Badge>
                  <Badge tone="accent">{org.approval === 'approved' ? 'Active member' : label(org.approval)}</Badge>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-ink-muted">About</h3>
                {!editing && (
                  <Button size="sm" variant="ghost" onClick={() => { setDescription(org.description ?? ''); setEditing(true); }}>
                    Edit
                  </Button>
                )}
              </div>
              {editing ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                  <textarea
                    aria-label="About your organisation"
                    className="field h-auto py-2 leading-relaxed"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busy}
                      onClick={async () => {
                        if (await save({ description: description.trim() }, 'Description saved')) setEditing(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{org.description || 'No description yet.'}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line px-5 py-4 text-sm sm:grid-cols-4">
              {details
                .filter(([, v]) => v !== undefined && v !== '' && v !== 'Unknown')
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-ink-muted">{k}</dt>
                    <dd className={`mt-0.5 ${k === 'Member ID' ? 'num' : ''}`}>{v}</dd>
                  </div>
                ))}
            </dl>
          </section>

          <Section
            title="Focus areas"
            description="Choose from your network's list. They drive the bridge and gap insights, so keep them current."
          >
            <div className="flex flex-wrap gap-2">
              {vocabulary.map((area) => {
                const on = mine.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    aria-pressed={on}
                    disabled={busy}
                    onClick={() => toggleArea(area)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors disabled:opacity-60 ${
                      on ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink-soft hover:border-zinc-300 hover:text-ink'
                    }`}
                  >
                    <span aria-hidden="true">{on ? '✓' : '+'}</span>
                    {area}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        <Section title="Your network">
          <h3 className="font-semibold">{data.unity?.name ?? session.unityId}</h3>
          {data.unity?.description && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{data.unity.description}</p>}
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Network ID</dt>
              <dd className="num">{session.unityId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Members</dt>
              <dd className="num">{members}</dd>
            </div>
            {data.unity?.created && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Created</dt>
                <dd>{formatDate(data.unity.created)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Accepting members</dt>
              <dd>{data.unity?.acceptingMembers === false ? 'No' : 'Yes'}</dd>
            </div>
          </dl>
          <h4 className="mt-5 text-xs font-medium text-ink-muted">Focus areas in this network</h4>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {vocabulary.map((a) => (
              <li key={a} className="rounded-md border border-line px-2 py-0.5 text-xs text-ink-soft">{a}</li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

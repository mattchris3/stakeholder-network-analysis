import { useMemo, useState } from 'react';
import MeetingDrawer from '../../components/MeetingDrawer';
import { EmptyState, Section } from '../../components/layout';
import { label } from '../../lib/sectors';
import { MEETING_TYPES } from '../../lib/meetings';
import type { Meeting } from '../../lib/types';
import { useMeetings } from './MeetingsLayout';
import { MeetingRow } from './MeetingRow';

export default function History() {
  const { data, session } = useMeetings();
  const [open, setOpen] = useState<Meeting | null>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const byId = useMemo(() => new Map(data.entities.map((e) => [e.id, e])), [data.entities]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.meetings
      .filter((m) => m.status === 'confirmed')
      .filter((m) => type === 'all' || m.type === type)
      .filter((m) => !onlyMine || m.participants.includes(session.orgId))
      .filter(
        (m) =>
          !q ||
          m.title.toLowerCase().includes(q) ||
          (m.location ?? '').toLowerCase().includes(q) ||
          m.participants.some((p) => (byId.get(p)?.name ?? '').toLowerCase().includes(q)),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.meetings, query, type, onlyMine, session.orgId, byId]);

  return (
    <Section
      title="All verified meetings"
      description={`${list.length} shown. These are the meetings that make up the network graph.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input className="field h-8 w-44 text-[13px]" placeholder="Search" aria-label="Search meetings" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="field h-8 w-auto text-[13px]" aria-label="Meeting type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {MEETING_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select>
          <label className="inline-flex h-8 items-center gap-2 text-[13px] text-ink-soft">
            <input type="checkbox" className="size-4 accent-accent" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
            Only mine
          </label>
        </div>
      }
      flush
    >
      {list.length === 0 ? (
        <EmptyState title="No meetings match" body="Try another search or type." />
      ) : (
        <ul className="divide-y divide-line-soft">
          {list.map((m) => (
            <MeetingRow key={m.id} meeting={m} host={byId.get(m.hostId ?? '')} onOpen={() => setOpen(m)} />
          ))}
        </ul>
      )}
      <MeetingDrawer meeting={open} entities={data.entities} onClose={() => setOpen(null)} />
    </Section>
  );
}

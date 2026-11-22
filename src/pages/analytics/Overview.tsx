import { useMemo, useState } from 'react';
import MeetingDrawer from '../../components/MeetingDrawer';
import { EmptyState, Section, StatCard } from '../../components/layout';
import { Dot } from '../../components/ui';
import { personalOverview } from '../../lib/analytics';
import { formatDate, ordinal, plural } from '../../lib/format';
import { label, sectorColor } from '../../lib/sectors';
import type { Meeting } from '../../lib/types';
import { useAnalytics } from './AnalyticsLayout';

export default function Overview() {
  const { input, session, data } = useAnalytics();
  const o = useMemo(() => personalOverview(input, session.orgId), [input, session.orgId]);
  const [open, setOpen] = useState<Meeting | null>(null);
  const top = o.collaborators[0]?.meetings || 1;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Your verified meetings" value={o.meetings.length} />
        <StatCard label="Organisations you've met" value={o.collaborators.length} hint={`of ${o.ofTotal - 1} other members`} />
        <StatCard label="Most common meeting type" value={<span className="font-sans">{o.topType ? label(o.topType) : '—'}</span>} />
        <StatCard label="Network rank" value={ordinal(o.rank)} hint={`by meetings, of ${o.ofTotal}`} />
      </dl>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Section title="Your closest partners" description="Verified meetings you've shared with each organisation." flush>
          {o.collaborators.length === 0 ? (
            <EmptyState title="No verified meetings yet" body="Log a meeting and ask its participants to verify it." />
          ) : (
            <ol className="divide-y divide-line-soft">
              {o.collaborators.slice(0, 8).map((c) => (
                <li key={c.entity.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <Dot color={sectorColor(c.entity.sector ?? '')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.entity.name}</p>
                    <div className="mt-1 h-1 rounded-full bg-line-soft">
                      <div className="h-full rounded-full bg-accent/70" style={{ width: `${(c.meetings / top) * 100}%` }} />
                    </div>
                  </div>
                  <span className="num text-sm text-ink-soft">{c.meetings}</span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Recent meetings" description="Select one to see its purpose, outcome and who verified it." flush>
          {o.meetings.length === 0 ? (
            <EmptyState title="Nothing here yet" />
          ) : (
            <ul className="divide-y divide-line-soft">
              {o.meetings.slice(0, 8).map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(m)}
                    className="flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-sunken sm:px-5"
                  >
                    <span className="num w-24 shrink-0 text-xs text-ink-muted">{formatDate(m.date)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.title}</span>
                      <span className="text-xs text-ink-muted">
                        {label(m.type)} · {label(m.format)} · {plural(m.participants.length, 'organisation')}
                      </span>
                    </span>
                    <span aria-hidden="true" className="text-ink-muted">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <MeetingDrawer meeting={open} entities={data.entities} onClose={() => setOpen(null)} />
    </div>
  );
}

import type { ReactNode } from 'react';
import { formatDate, plural } from '../../lib/format';
import { progress } from '../../lib/meetings';
import { label } from '../../lib/sectors';
import type { Entity, Meeting } from '../../lib/types';

/** Verified / total, as a small segmented bar. */
export function Progress({ meeting }: { meeting: Meeting }) {
  const p = progress(meeting);
  return (
    <span className="inline-flex items-center gap-2" title={`${p.approved} of ${p.total} verified`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {meeting.participants.map((id) => {
          const s = meeting.approvals?.[id] ?? 'pending';
          const c = s === 'approved' ? 'bg-emerald-500' : s === 'disputed' ? 'bg-danger' : 'bg-line';
          return <span key={id} className={`h-1.5 w-3 rounded-full ${c}`} />;
        })}
      </span>
      <span className="num text-xs text-ink-muted">
        {p.approved}/{p.total}
        {p.disputed > 0 && <span className="text-danger"> · {p.disputed} disputed</span>}
      </span>
    </span>
  );
}

export function MeetingRow({
  meeting,
  host,
  onOpen,
  actions,
  meta,
}: {
  meeting: Meeting;
  host?: Entity;
  onOpen: () => void;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <button type="button" onClick={onOpen} className="group min-w-0 flex-1 text-left">
        <span className="flex items-baseline gap-3">
          <span className="num w-24 shrink-0 text-xs text-ink-muted">{formatDate(meeting.date)}</span>
          <span className="truncate text-sm font-medium group-hover:text-accent">{meeting.title}</span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-27 text-xs text-ink-muted">
          {host && <span>Logged by {host.name}</span>}
          <span>
            {label(meeting.type)} · {label(meeting.format)} · {plural(meeting.participants.length, 'organisation')}
          </span>
          {meta}
        </span>
      </button>
      {actions && <div className="flex shrink-0 gap-2 pl-27 sm:pl-0">{actions}</div>}
    </li>
  );
}

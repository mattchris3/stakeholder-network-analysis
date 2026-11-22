import type { ReactNode } from 'react';
import { formatDate } from '../lib/format';
import { label, sectorColor } from '../lib/sectors';
import type { Entity, Meeting } from '../lib/types';
import { Drawer } from './layout';
import { Badge, Dot } from './ui';

export const APPROVAL_STYLE: Record<string, { text: string; className: string }> = {
  approved: { text: 'Verified', className: 'bg-emerald-50 text-emerald-800' },
  pending: { text: 'Waiting', className: 'bg-amber-50 text-amber-800' },
  disputed: { text: 'Disputed', className: 'bg-danger-soft text-danger' },
};

export const STATUS_STYLE: Record<string, { text: string; className: string }> = {
  confirmed: { text: 'Confirmed', className: 'bg-emerald-50 text-emerald-800' },
  pending: { text: 'Awaiting verification', className: 'bg-amber-50 text-amber-800' },
  disputed: { text: 'Disputed', className: 'bg-danger-soft text-danger' },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { text: label(status), className: 'bg-sunken text-ink-soft' };
  return <span className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${s.className}`}>{s.text}</span>;
}

export default function MeetingDrawer({
  meeting,
  entities,
  onClose,
  footer,
  children,
}: {
  meeting: Meeting | null;
  entities: Entity[];
  onClose: () => void;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const byId = new Map(entities.map((e) => [e.id, e]));
  return (
    <Drawer
      open={meeting !== null}
      onClose={onClose}
      title={meeting?.title}
      subtitle={meeting && `${formatDate(meeting.date)}${meeting.location ? ` · ${meeting.location}` : ''}`}
      footer={footer}
    >
      {meeting && (
        <div className="divide-y divide-line">
          <div className="flex flex-wrap gap-1.5 px-5 py-4">
            <StatusPill status={meeting.status} />
            {meeting.type && <Badge>{label(meeting.type)}</Badge>}
            {meeting.format && <Badge>{label(meeting.format)}</Badge>}
          </div>
          {children}
          {meeting.purpose && <Prose heading="Purpose">{meeting.purpose}</Prose>}
          {meeting.outcome && <Prose heading="Outcome">{meeting.outcome}</Prose>}
          <div className="px-5 py-4">
            <h3 className="text-xs font-medium text-ink-muted">Participants</h3>
            <ul className="mt-2 space-y-1">
              {meeting.participants.map((id) => {
                const e = byId.get(id);
                const a = APPROVAL_STYLE[meeting.approvals?.[id] ?? 'pending'] ?? APPROVAL_STYLE.pending;
                return (
                  <li key={id} className="flex items-center gap-3 py-1.5">
                    <Dot color={sectorColor(e?.sector ?? '')} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e?.fullName ?? e?.name ?? id}</span>
                      {meeting.hostId === id && <span className="text-xs text-ink-muted">Host</span>}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${a.className}`}>{a.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Prose({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <h3 className="text-xs font-medium text-ink-muted">{heading}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

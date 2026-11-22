import { useState } from 'react';
import { EmptyState, Section } from '../../components/layout';
import { Button, Dot } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { label, sectorColor } from '../../lib/sectors';
import type { Entity } from '../../lib/types';
import { useAdmin } from './AdminLayout';
import OrgDrawer from './OrgDrawer';

export default function Applications() {
  const { pending, requestAction, data } = useAdmin();
  const [open, setOpen] = useState<Entity | null>(null);
  const code = data.unity?.accessCode;

  return (
    <Section title="Applications" description="Organisations that used your access code to apply. Review each one before it joins." flush>
      {pending.length === 0 ? (
        <EmptyState
          title="No applications waiting"
          body={code ? `Share your access code ${code} with organisations you'd like to invite.` : 'New applications appear here.'}
        />
      ) : (
        <ul className="divide-y divide-line-soft">
          {pending
            .slice()
            .sort((a, b) => (b.appliedDate ?? '').localeCompare(a.appliedDate ?? ''))
            .map((e) => (
              <li key={e.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <button type="button" className="group flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen(e)}>
                  <Dot color={sectorColor(e.sector ?? '')} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:text-accent">{e.fullName ?? e.name}</span>
                    <span className="text-xs text-ink-muted">
                      {label(e.sector)} · {label(e.type)}
                      {e.appliedDate && ` · applied ${formatDate(e.appliedDate)}`}
                    </span>
                  </span>
                </button>
                <div className="flex gap-2 pl-5 sm:pl-0">
                  <Button size="sm" onClick={() => requestAction(e, 'reject')}>Reject</Button>
                  <Button size="sm" variant="primary" onClick={() => requestAction(e, 'approve')}>Approve</Button>
                </div>
              </li>
            ))}
        </ul>
      )}
      <OrgDrawer
        entity={open}
        onClose={() => setOpen(null)}
        footer={
          open && (
            <>
              <Button onClick={() => { requestAction(open, 'reject'); setOpen(null); }}>Reject</Button>
              <Button variant="primary" onClick={() => { requestAction(open, 'approve'); setOpen(null); }}>Approve</Button>
            </>
          )
        }
      />
    </Section>
  );
}

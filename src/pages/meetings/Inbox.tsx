import { useState } from 'react';
import MeetingDrawer from '../../components/MeetingDrawer';
import { EmptyState, Section } from '../../components/layout';
import { Button, ButtonLink } from '../../components/ui';
import type { Meeting } from '../../lib/types';
import { useMeetings } from './MeetingsLayout';
import { MeetingRow, Progress } from './MeetingRow';

export default function Inbox() {
  const { inbox, data, requestDecision } = useMeetings();
  const [open, setOpen] = useState<Meeting | null>(null);
  const byId = new Map(data.entities.map((e) => [e.id, e]));
  // Keep the drawer in step with saved changes.
  const current = open && (data.meetings.find((m) => m.id === open.id) ?? open);

  return (
    <div className="space-y-4">
      <Section
        title="Waiting for you"
        description="Meetings other members logged with you. Verify the ones that happened as described; dispute the rest."
        flush
      >
        {inbox.toVerify.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            body="When another member logs a meeting with you, it appears here."
            action={<ButtonLink to="/app/meetings/new" size="sm">Log a meeting</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-line-soft">
            {inbox.toVerify.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                host={byId.get(m.hostId ?? '')}
                onOpen={() => setOpen(m)}
                meta={<Progress meeting={m} />}
                actions={
                  <>
                    <Button size="sm" onClick={() => requestDecision(m, 'disputed')}>Dispute</Button>
                    <Button size="sm" variant="primary" onClick={() => requestDecision(m, 'approved')}>Verify</Button>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </Section>

      {inbox.disputed.length > 0 && (
        <Section title="You disputed" description="These don't count until you withdraw the dispute." flush>
          <ul className="divide-y divide-line-soft">
            {inbox.disputed.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                host={byId.get(m.hostId ?? '')}
                onOpen={() => setOpen(m)}
                meta={<Progress meeting={m} />}
                actions={<Button size="sm" onClick={() => requestDecision(m, 'pending')}>Withdraw dispute</Button>}
              />
            ))}
          </ul>
        </Section>
      )}

      {inbox.waitingOnOthers.length > 0 && (
        <Section title="Verified by you, waiting on others" flush>
          <ul className="divide-y divide-line-soft">
            {inbox.waitingOnOthers.map((m) => (
              <MeetingRow key={m.id} meeting={m} host={byId.get(m.hostId ?? '')} onOpen={() => setOpen(m)} meta={<Progress meeting={m} />} />
            ))}
          </ul>
        </Section>
      )}

      <MeetingDrawer
        meeting={current}
        entities={data.entities}
        onClose={() => setOpen(null)}
        footer={
          current && inbox.toVerify.some((m) => m.id === current.id) ? (
            <>
              <Button onClick={() => requestDecision(current, 'disputed')}>Dispute</Button>
              <Button variant="primary" onClick={() => requestDecision(current, 'approved')}>Verify</Button>
            </>
          ) : undefined
        }
      />
    </div>
  );
}

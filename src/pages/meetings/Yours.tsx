import { useState } from 'react';
import MeetingDrawer, { StatusPill } from '../../components/MeetingDrawer';
import { EmptyState, Section } from '../../components/layout';
import { ButtonLink } from '../../components/ui';
import type { Meeting } from '../../lib/types';
import { useMeetings } from './MeetingsLayout';
import { MeetingRow, Progress } from './MeetingRow';

export default function Yours() {
  const { inbox, data } = useMeetings();
  const [open, setOpen] = useState<Meeting | null>(null);

  return (
    <Section title="Meetings you logged" description="Track who has verified each one." flush>
      {inbox.hosted.length === 0 ? (
        <EmptyState
          title="You haven't logged a meeting yet"
          body="Log one and every participant is asked to verify it."
          action={<ButtonLink to="/app/meetings/new" size="sm" variant="primary">Log a meeting</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-line-soft">
          {inbox.hosted.map((m) => (
            <MeetingRow
              key={m.id}
              meeting={m}
              onOpen={() => setOpen(m)}
              meta={<Progress meeting={m} />}
              actions={<StatusPill status={m.status} />}
            />
          ))}
        </ul>
      )}
      <MeetingDrawer meeting={open} entities={data.entities} onClose={() => setOpen(null)} />
    </Section>
  );
}

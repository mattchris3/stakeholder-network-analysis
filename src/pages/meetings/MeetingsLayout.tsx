import { useCallback, useMemo, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router';
import { useShell, type ShellContext } from '../../components/AppShell';
import { ConfirmDialog, PageHeader, SubNav } from '../../components/layout';
import { useToast } from '../../components/Toast';
import { ButtonLink } from '../../components/ui';
import { decide, inbox, VerificationError, type Decision, type Inbox } from '../../lib/meetings';
import type { Meeting } from '../../lib/types';

export interface MeetingsContext extends ShellContext {
  inbox: Inbox;
  /** Asks for confirmation, then records this member's decision. */
  requestDecision: (meeting: Meeting, decision: Decision) => void;
}

export function useMeetings() {
  return useOutletContext<MeetingsContext>();
}

const COPY: Record<Decision, { title: string; body: string; confirm: string; done: string; tone: 'primary' | 'danger' }> = {
  approved: {
    title: 'Verify this meeting?',
    body: "You're confirming it took place as described. Verification is permanent.",
    confirm: 'Verify',
    done: 'Meeting verified',
    tone: 'primary',
  },
  disputed: {
    title: 'Dispute this meeting?',
    body: "It won't count towards the network until you withdraw the dispute. You can do that at any time.",
    confirm: 'Dispute',
    done: 'Meeting disputed',
    tone: 'danger',
  },
  pending: {
    title: 'Withdraw your dispute?',
    body: 'The meeting goes back to your list to verify.',
    confirm: 'Withdraw dispute',
    done: 'Dispute withdrawn',
    tone: 'primary',
  },
};

export default function MeetingsLayout() {
  const shell = useShell();
  const toast = useToast();
  const box = useMemo(() => inbox(shell.data.meetings, shell.session.orgId), [shell.data.meetings, shell.session.orgId]);
  const [pending, setPending] = useState<{ meeting: Meeting; decision: Decision } | null>(null);
  const [busy, setBusy] = useState(false);

  const requestDecision = useCallback((meeting: Meeting, decision: Decision) => setPending({ meeting, decision }), []);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      const updated = decide(pending.meeting, shell.session.orgId, pending.decision);
      await shell.saveMeeting(updated, 'decision');
      toast(updated.status === 'confirmed' ? 'Verified. Every participant has now confirmed it.' : COPY[pending.decision].done);
      setPending(null);
    } catch (e) {
      toast(e instanceof VerificationError ? e.message : "Couldn't save that. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  }

  const copy = pending ? COPY[pending.decision] : COPY.approved;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <PageHeader
        title="Meetings"
        description={
          shell.session.demo
            ? "Demo mode: try verifying, disputing or logging a meeting. Changes stay in this tab and aren't saved."
            : 'A meeting counts once every participant has verified it.'
        }
        actions={
          <ButtonLink to="/app/meetings/new" variant="primary" size="sm">
            Log a meeting
          </ButtonLink>
        }
      />
      <SubNav
        items={[
          { to: '/app/meetings', label: 'To verify', badge: box.toVerify.length },
          { to: '/app/meetings/yours', label: 'Logged by you' },
          { to: '/app/meetings/history', label: 'All verified' },
          { to: '/app/meetings/new', label: 'Log a meeting' },
        ]}
      />
      <Outlet context={{ ...shell, inbox: box, requestDecision } satisfies MeetingsContext} />
      <ConfirmDialog
        open={pending !== null}
        title={copy.title}
        body={
          <>
            <span className="font-medium text-ink">{pending?.meeting.title}</span>
            <br />
            {copy.body}
          </>
        }
        confirmLabel={copy.confirm}
        tone={copy.tone}
        busy={busy}
        onConfirm={confirm}
        onCancel={() => !busy && setPending(null)}
      />
    </div>
  );
}

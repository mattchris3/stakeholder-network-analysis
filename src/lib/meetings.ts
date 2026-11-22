// The peer-verification workflow as pure functions.
// Rules (unchanged from the original):
// - the host approves its own meeting when logging it;
// - each other participant verifies or disputes on its own;
// - verifying is permanent; a dispute can be withdrawn (back to pending);
// - a meeting is confirmed once every participant has verified it.
import type { Meeting } from './types';

export type Decision = 'approved' | 'disputed' | 'pending';

export const MEETING_TYPES = ['strategy', 'coordination', 'research', 'funding', 'training', 'emergency'] as const;
export const MEETING_FORMATS = ['in-person', 'virtual', 'hybrid'] as const;

export function approvalOf(meeting: Meeting, orgId: string): Decision {
  return (meeting.approvals?.[orgId] as Decision | undefined) ?? 'pending';
}

export function progress(meeting: Meeting) {
  const states = meeting.participants.map((p) => approvalOf(meeting, p));
  return {
    total: states.length,
    approved: states.filter((s) => s === 'approved').length,
    disputed: states.filter((s) => s === 'disputed').length,
    pending: states.filter((s) => s === 'pending').length,
  };
}

export interface Inbox {
  /** Others' meetings that include me and still need my decision. */
  toVerify: Meeting[];
  /** Meetings I disputed (I can withdraw the dispute). */
  disputed: Meeting[];
  /** I verified; still waiting on other participants. */
  waitingOnOthers: Meeting[];
  /** Meetings I logged, any status. */
  hosted: Meeting[];
}

export function inbox(meetings: Meeting[], orgId: string): Inbox {
  const mine = meetings.filter((m) => m.participants.includes(orgId));
  const newest = (a: Meeting, b: Meeting) => b.date.localeCompare(a.date);
  return {
    toVerify: mine.filter((m) => m.hostId !== orgId && m.status !== 'confirmed' && approvalOf(m, orgId) === 'pending').sort(newest),
    disputed: mine.filter((m) => approvalOf(m, orgId) === 'disputed').sort(newest),
    waitingOnOthers: mine
      .filter((m) => m.hostId !== orgId && m.status !== 'confirmed' && approvalOf(m, orgId) === 'approved')
      .sort(newest),
    hosted: mine.filter((m) => m.hostId === orgId).sort(newest),
  };
}

export class VerificationError extends Error {}

/** Returns the meeting with this participant's decision applied. */
export function decide(meeting: Meeting, orgId: string, decision: Decision): Meeting {
  if (!meeting.participants.includes(orgId)) throw new VerificationError('Only participants can verify a meeting.');
  const current = approvalOf(meeting, orgId);
  if (current === 'approved') throw new VerificationError("You've already verified this meeting. Verification can't be undone.");
  if (decision === 'pending' && current !== 'disputed') throw new VerificationError('Only a dispute can be withdrawn.');

  const approvals = { ...meeting.approvals, [orgId]: decision };
  const allApproved = meeting.participants.every((p) => approvals[p] === 'approved');
  // Status stays 'pending' while any decision is outstanding or disputed, as in the
  // original app (which shares this database); disputes are read from `approvals`.
  return { ...meeting, approvals, status: allApproved ? 'confirmed' : 'pending' };
}

export interface MeetingDraft {
  title: string;
  date: string;
  type: string;
  format: string;
  location: string;
  purpose: string;
  outcome: string;
  participants: string[];
}

export type DraftErrors = Partial<Record<keyof MeetingDraft, string>>;

export function validateDraft(draft: MeetingDraft, today = new Date().toISOString().slice(0, 10)): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.title.trim()) errors.title = 'Give the meeting a title.';
  if (!draft.date) errors.date = 'Enter the date it took place.';
  else if (draft.date > today) errors.date = "Only log meetings that have already happened.";
  if (!draft.type) errors.type = 'Choose a meeting type.';
  if (!draft.format) errors.format = 'Choose how you met.';
  if (!draft.location.trim()) errors.location = 'Enter a place, or "Virtual".';
  if (draft.purpose.trim().length < 10) errors.purpose = 'Describe the purpose in a sentence or two.';
  if (draft.outcome.trim().length < 10) errors.outcome = 'Describe what came out of it.';
  if (draft.participants.length === 0) errors.participants = 'Choose at least one other organisation.';
  return errors;
}

export function createMeeting(draft: MeetingDraft, hostId: string, unityId: string, now = new Date()): Meeting {
  const participants = [hostId, ...draft.participants.filter((p) => p !== hostId)];
  return {
    id: `MEET-${now.getTime()}`,
    unityId,
    title: draft.title.trim(),
    date: draft.date,
    type: draft.type,
    format: draft.format,
    location: draft.location.trim(),
    purpose: draft.purpose.trim(),
    outcome: draft.outcome.trim(),
    participants,
    hostId,
    status: 'pending',
    approvals: Object.fromEntries(participants.map((p) => [p, p === hostId ? 'approved' : 'pending'])),
  };
}

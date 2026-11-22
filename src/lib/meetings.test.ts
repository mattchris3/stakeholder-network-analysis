import { describe, expect, it } from 'vitest';
import type { Meeting } from './types';
import { createMeeting, decide, inbox, progress, validateDraft, VerificationError, type MeetingDraft } from './meetings';

const draft: MeetingDraft = {
  title: 'Cold chain review',
  date: '2025-05-01',
  type: 'coordination',
  format: 'virtual',
  location: 'Virtual',
  purpose: 'Review vaccine cold-chain gaps.',
  outcome: 'Agreed a shared audit template.',
  participants: ['B', 'C'],
};

describe('createMeeting', () => {
  it('puts the host first and pre-approves it', () => {
    const m = createMeeting(draft, 'A', 'U', new Date(1_700_000_000_000));
    expect(m.id).toBe('MEET-1700000000000');
    expect(m.participants).toEqual(['A', 'B', 'C']);
    expect(m.approvals).toEqual({ A: 'approved', B: 'pending', C: 'pending' });
    expect(m.status).toBe('pending');
  });
});

describe('decide', () => {
  const m = createMeeting(draft, 'A', 'U');

  it('confirms once every participant verifies', () => {
    const one = decide(m, 'B', 'approved');
    expect(one.status).toBe('pending');
    expect(progress(one)).toMatchObject({ approved: 2, pending: 1 });
    expect(decide(one, 'C', 'approved').status).toBe('confirmed');
  });

  it('lets a dispute be withdrawn but not a verification', () => {
    const disputed = decide(m, 'B', 'disputed');
    expect(disputed.status).toBe('pending');
    expect(progress(disputed).disputed).toBe(1);
    expect(decide(disputed, 'B', 'pending').status).toBe('pending');
    expect(() => decide(decide(m, 'B', 'approved'), 'B', 'disputed')).toThrow(VerificationError);
  });

  it('rejects non-participants', () => {
    expect(() => decide(m, 'Z', 'approved')).toThrow(VerificationError);
  });
});

describe('inbox', () => {
  const base = createMeeting(draft, 'A', 'U');
  const meetings: Meeting[] = [
    { ...base, id: 'm1' },
    { ...decide(base, 'B', 'approved'), id: 'm2' },
    { ...decide(base, 'B', 'disputed'), id: 'm3' },
    { ...decide(decide(base, 'B', 'approved'), 'C', 'approved'), id: 'm4' },
  ];
  it('sorts meetings into what B has to do', () => {
    const b = inbox(meetings, 'B');
    expect(b.toVerify.map((m) => m.id)).toEqual(['m1']);
    expect(b.waitingOnOthers.map((m) => m.id)).toEqual(['m2']);
    expect(b.disputed.map((m) => m.id)).toEqual(['m3']);
    expect(inbox(meetings, 'A').hosted).toHaveLength(4);
  });
});

describe('validateDraft', () => {
  it('accepts a complete draft', () => {
    expect(validateDraft(draft, '2025-06-01')).toEqual({});
  });
  it('rejects future dates and missing participants', () => {
    const errors = validateDraft({ ...draft, date: '2030-01-01', participants: [] }, '2025-06-01');
    expect(Object.keys(errors).sort()).toEqual(['date', 'participants']);
  });
});

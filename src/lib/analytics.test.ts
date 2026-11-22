import { describe, expect, it } from 'vitest';
import type { Entity, Meeting } from './types';
import {
  analyticsInput,
  breakdown,
  bridges,
  contributions,
  gaps,
  influenceScores,
  levelOf,
  monthlyActivity,
  personalOverview,
} from './analytics';

const U = 'U';
const e = (id: string, sector: string, focusAreas: string[], fundingType = 'implementer'): Entity => ({
  id, unityId: U, name: id, sector, focusAreas, fundingType, status: 'active', approval: 'approved',
});
const m = (id: string, date: string, participants: string[], extra: Partial<Meeting> = {}): Meeting => ({
  id, unityId: U, title: id, date, participants, status: 'confirmed', type: 'strategy', format: 'virtual', ...extra,
});

// A–B–C talk a lot; D meets only A; E shares a focus with C but never met it.
const entities = [
  e('A', 'health', ['vaccines', 'surveillance']),
  e('B', 'health', ['vaccines']),
  e('C', 'tech', ['data']),
  e('D', 'finance', ['funding'], 'donor'),
  e('E', 'tech', ['data']),
];
const meetings = [
  m('1', '2025-01-05', ['A', 'B', 'C'], { hostId: 'A' }),
  m('2', '2025-01-20', ['A', 'B'], { type: 'research' }),
  m('3', '2025-03-02', ['A', 'D'], { format: 'in-person' }),
  m('4', '2025-03-09', ['B', 'C']),
  m('5', '2025-03-10', ['A', 'C', 'E'], { status: 'pending' }),
];
const input = analyticsInput(entities, meetings, U);

describe('analyticsInput', () => {
  it('ignores pending meetings', () => {
    expect(input.meetings.map((x) => x.id)).toEqual(['1', '2', '3', '4']);
  });
});

describe('personalOverview', () => {
  const o = personalOverview(input, 'A');
  it('counts my meetings and partners', () => {
    expect(o.meetings).toHaveLength(3);
    expect(o.collaborators.map((c) => [c.entity.id, c.meetings])).toEqual([['B', 2], ['C', 1], ['D', 1]]);
    expect(o.topType).toBe('strategy');
  });
  it('ranks with ties sharing a place', () => {
    expect(o.rank).toBe(1); // A and B both have 3 meetings
    expect(personalOverview(input, 'B').rank).toBe(1);
    expect(personalOverview(input, 'E').rank).toBe(5);
  });
});

describe('influenceScores', () => {
  const scores = influenceScores(input);
  it('weights meetings, partners and bridge meetings', () => {
    const a = scores.find((s) => s.entity.id === 'A')!;
    expect(a).toMatchObject({ meetings: 3, partners: 3, bridge: 1, score: 100 });
    expect(scores[0].entity.id).toBe('A');
  });
  it('gives an unconnected member zero', () => {
    expect(scores.find((s) => s.entity.id === 'E')!.score).toBe(0);
  });
});

describe('activity', () => {
  it('fills empty months', () => {
    expect(monthlyActivity(input.meetings)).toEqual([
      { month: '2025-01', count: 2 },
      { month: '2025-02', count: 0 },
      { month: '2025-03', count: 2 },
    ]);
  });
  it('breaks down by type', () => {
    expect(breakdown(input.meetings, 'type')).toEqual([
      { key: 'strategy', count: 3 },
      { key: 'research', count: 1 },
    ]);
  });
});

describe('insights', () => {
  it('scores unique contribution', () => {
    const a = contributions(input).find((c) => c.entity.id === 'A')!;
    expect(a.exclusivePartners.map((x) => x.id)).toEqual(['D']); // D meets only A
    expect(a.uniqueFocusAreas).toEqual(['surveillance']);
    expect(a.rareFocusAreas).toEqual(['vaccines']);
    // 25 exclusive + 20 unique + 10 rare + 0 role + min(3*3, 30)
    expect(a.score).toBe(64);
    expect(a.level).toBe('critical');
    expect(levelOf(39)).toBe('moderate');
  });

  it('finds cross-sector and cross-focus bridges', () => {
    const b = bridges(input);
    const ad = b.find((x) => x.a.id === 'A' && x.b.id === 'D')!;
    expect(ad).toMatchObject({ crossSector: true, crossFocus: true });
    expect(b[0].crossSector && b[0].crossFocus).toBe(true);
    expect(b.some((x) => x.a.id === 'A' && x.b.id === 'B')).toBe(false); // same sector, shared focus
  });

  it('finds members with shared focus who never met', () => {
    const g = gaps(input);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ a: { id: 'C' }, b: { id: 'E' }, sharedFocus: ['data'] });
  });
});

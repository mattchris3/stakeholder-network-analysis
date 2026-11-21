import { describe, expect, it } from 'vitest';
import snapshot from '../data/demo-snapshot.json';
import type { Entity, Meeting } from './types';
import {
  DEFAULT_FILTERS,
  buildNetwork,
  filterNetwork,
  networkStats,
  partnersOf,
  periodCutoff,
  strengthOf,
} from './network';

const U = 'U-1';
const entity = (id: string, extra: Partial<Entity> = {}): Entity => ({
  id, unityId: U, name: id, sector: 'healthcare', status: 'active', approval: 'approved', ...extra,
});
const meeting = (id: string, date: string, participants: string[], extra: Partial<Meeting> = {}): Meeting => ({
  id, unityId: U, title: id, date, participants, status: 'confirmed', ...extra,
});

const entities = [
  entity('A'),
  entity('B', { sector: 'education' }),
  entity('C'),
  entity('D', { approval: 'pending' }),
  entity('X', { unityId: 'U-2' }),
];
const meetings = [
  meeting('m1', '2025-01-10', ['A', 'B']),
  meeting('m2', '2025-06-10', ['A', 'B', 'C']),
  meeting('m3', '2025-12-01', ['A', 'C']),
  meeting('m4', '2025-12-05', ['A', 'B'], { status: 'pending' }),
  meeting('m5', '2025-12-06', ['A', 'D']),
  meeting('m6', '2025-12-07', ['A', 'X']),
];

describe('buildNetwork', () => {
  const net = buildNetwork(entities, meetings, U);

  it('keeps only active, approved members of the Unity', () => {
    expect(net.nodes.map((n) => n.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('counts only confirmed meetings and ignores outsiders', () => {
    const a = net.nodes.find((n) => n.id === 'A')!;
    expect(a.meetings).toBe(5); // m1, m2, m3, m5, m6 (D and X are dropped from links, not from A's count)
    expect(net.links.find((l) => l.source === 'A' && l.target === 'B')!.value).toBe(2);
    expect(net.links.some((l) => l.target === 'D' || l.target === 'X')).toBe(false);
  });

  it('computes degree and stats', () => {
    expect(net.nodes.find((n) => n.id === 'A')!.degree).toBe(2);
    expect(networkStats(net)).toEqual({ organisations: 3, connections: 3, meetings: 5, avgConnections: 2 });
  });
});

describe('filterNetwork', () => {
  const net = buildNetwork(entities, meetings, U);

  it('counts periods back from the latest meeting', () => {
    expect(periodCutoff(net.meetings, '6')).toBe('2025-06-07');
    const f = filterNetwork(net, { ...DEFAULT_FILTERS, period: '6' });
    expect(f.links.find((l) => l.source === 'A' && l.target === 'B')!.value).toBe(1);
  });

  it('filters by sector and drops links leaving it', () => {
    const f = filterNetwork(net, { ...DEFAULT_FILTERS, sector: 'healthcare' });
    expect(f.nodes.map((n) => n.id).sort()).toEqual(['A', 'C']);
    expect(f.links).toHaveLength(1);
  });

  it('finds links between two searched organisations', () => {
    const f = filterNetwork(net, { ...DEFAULT_FILTERS, searchA: 'b', searchB: 'c' });
    expect(f.links).toHaveLength(1);
    expect(f.nodes.map((n) => n.id).sort()).toEqual(['B', 'C']);
  });

  it('classifies strength', () => {
    expect([strengthOf(1), strengthOf(3), strengthOf(6)]).toEqual(['weak', 'medium', 'strong']);
  });

  it('lists partners strongest first', () => {
    expect(partnersOf(net, 'A').map((p) => p.node.id)).toEqual(['B', 'C']);
  });
});

describe('demo dataset', () => {
  it('produces a connected global-health network', () => {
    const net = buildNetwork(
      Object.values(snapshot.entities) as Entity[],
      Object.values(snapshot.meetings) as Meeting[],
      'UNITY-GLOBHEALTH-2025',
    );
    expect(net.nodes).toHaveLength(15);
    expect(net.links.length).toBeGreaterThan(20);
    expect(net.nodes.every((n) => n.entity.unityId === 'UNITY-GLOBHEALTH-2025')).toBe(true);
  });
});

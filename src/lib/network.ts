// Pure network logic: turns entities and confirmed meetings into a graph,
// then filters it. No DOM, no Firebase, so it is unit-tested directly.
import type { Entity, Meeting } from './types';

export interface NetworkNode {
  id: string;
  name: string;
  fullName: string;
  sector: string;
  fundingType: string;
  /** Confirmed meetings this organisation took part in (within the period). */
  meetings: number;
  /** Distinct partners it is linked to (within the current filter). */
  degree: number;
  entity: Entity;
}

export interface NetworkLink {
  source: string;
  target: string;
  /** Number of confirmed meetings the two organisations shared. */
  value: number;
  dates: string[];
  meetingIds: string[];
}

export interface Network {
  nodes: NetworkNode[];
  links: NetworkLink[];
  meetings: Meeting[];
}

export type Strength = 'strong' | 'medium' | 'weak';
export type StrengthFilter = 'all' | Strength;
export type Period = 'all' | '12' | '6' | '3' | '1';

export const STRENGTH_THRESHOLDS = { strong: 6, medium: 3 } as const;

export function strengthOf(value: number): Strength {
  if (value >= STRENGTH_THRESHOLDS.strong) return 'strong';
  if (value >= STRENGTH_THRESHOLDS.medium) return 'medium';
  return 'weak';
}

export function linkKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Only active, approved members and confirmed meetings of one Unity count. */
export function buildNetwork(entities: Entity[], meetings: Meeting[], unityId: string): Network {
  const members = entities.filter(
    (e) => e.unityId === unityId && e.status === 'active' && e.approval === 'approved',
  );
  const memberIds = new Set(members.map((e) => e.id));
  const confirmed = meetings.filter((m) => m.unityId === unityId && m.status === 'confirmed');

  const meetingCounts = new Map<string, number>();
  const links = new Map<string, NetworkLink>();

  for (const meeting of confirmed) {
    const participants = [...new Set(meeting.participants ?? [])].filter((id) => memberIds.has(id));
    for (const id of participants) meetingCounts.set(id, (meetingCounts.get(id) ?? 0) + 1);

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const [source, target] = [participants[i], participants[j]].sort();
        const key = linkKey(source, target);
        const link = links.get(key) ?? { source, target, value: 0, dates: [], meetingIds: [] };
        link.value++;
        link.dates.push(meeting.date);
        link.meetingIds.push(meeting.id);
        links.set(key, link);
      }
    }
  }

  const linkList = [...links.values()];
  const degree = degreeMap(linkList);

  const nodes = members.map<NetworkNode>((e) => ({
    id: e.id,
    name: e.name || e.id,
    fullName: e.fullName || e.name || e.id,
    sector: e.sector || 'unknown',
    fundingType: e.fundingType || 'unknown',
    meetings: meetingCounts.get(e.id) ?? 0,
    degree: degree.get(e.id) ?? 0,
    entity: e,
  }));

  return { nodes, links: linkList, meetings: confirmed };
}

export interface NetworkFilters {
  sector: string;
  strength: StrengthFilter;
  period: Period;
  searchA: string;
  searchB: string;
  showIsolated: boolean;
}

export const DEFAULT_FILTERS: NetworkFilters = {
  sector: 'all',
  strength: 'all',
  period: 'all',
  searchA: '',
  searchB: '',
  showIsolated: true,
};

/**
 * Periods are counted back from the latest confirmed meeting rather than from
 * today, so a historic dataset never filters down to an empty graph.
 */
export function periodCutoff(meetings: Meeting[], period: Period): string | null {
  if (period === 'all' || meetings.length === 0) return null;
  const latest = meetings.reduce((max, m) => (m.date > max ? m.date : max), meetings[0].date);
  const d = new Date(`${latest}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - Number(period));
  return d.toISOString().slice(0, 10);
}

function matches(node: NetworkNode, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === '' || node.name.toLowerCase().includes(q) || node.fullName.toLowerCase().includes(q);
}

export function filterNetwork(network: Network, filters: NetworkFilters): Network {
  const cutoff = periodCutoff(network.meetings, filters.period);
  const meetings = cutoff ? network.meetings.filter((m) => m.date >= cutoff) : network.meetings;

  // 1. Re-weight links to the period.
  let links = network.links
    .map((l) => {
      if (!cutoff) return l;
      const keep = l.dates.map((d, i) => [d, l.meetingIds[i]] as const).filter(([d]) => d >= cutoff);
      return { ...l, value: keep.length, dates: keep.map(([d]) => d), meetingIds: keep.map(([, id]) => id) };
    })
    .filter((l) => l.value > 0);

  // 2. Sector.
  let nodes = network.nodes;
  if (filters.sector !== 'all') nodes = nodes.filter((n) => n.sector === filters.sector);
  let ids = new Set(nodes.map((n) => n.id));
  links = links.filter((l) => ids.has(l.source) && ids.has(l.target));

  // 3. Strength.
  if (filters.strength !== 'all') links = links.filter((l) => strengthOf(l.value) === filters.strength);

  // 4. Search: one box keeps that organisation's links; two boxes keep links between them.
  const a = filters.searchA.trim();
  const b = filters.searchB.trim();
  if (a || b) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const hit = (id: string, q: string) => {
      const n = byId.get(id);
      return n ? matches(n, q) : false;
    };
    links = links.filter((l) => {
      if (a && b) return (hit(l.source, a) && hit(l.target, b)) || (hit(l.source, b) && hit(l.target, a));
      const q = a || b;
      return hit(l.source, q) || hit(l.target, q);
    });
  }

  // 5. Drop unlinked nodes when any narrowing filter is on, or when asked to.
  const narrowed = Boolean(cutoff) || filters.strength !== 'all' || Boolean(a || b);
  if (narrowed || !filters.showIsolated) {
    const linked = new Set(links.flatMap((l) => [l.source, l.target]));
    nodes = nodes.filter((n) => linked.has(n.id));
  }
  ids = new Set(nodes.map((n) => n.id));

  // 6. Recount meetings and degree for what is left.
  const meetingCounts = new Map<string, number>();
  for (const m of meetings) {
    for (const id of new Set(m.participants)) {
      if (ids.has(id)) meetingCounts.set(id, (meetingCounts.get(id) ?? 0) + 1);
    }
  }
  const degree = degreeMap(links);
  nodes = nodes.map((n) => ({ ...n, meetings: meetingCounts.get(n.id) ?? 0, degree: degree.get(n.id) ?? 0 }));

  return { nodes, links, meetings };
}

function degreeMap(links: NetworkLink[]): Map<string, number> {
  const degree = new Map<string, number>();
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }
  return degree;
}

export interface Partner {
  node: NetworkNode;
  value: number;
  strength: Strength;
}

export function partnersOf(network: Network, id: string): Partner[] {
  const byId = new Map(network.nodes.map((n) => [n.id, n]));
  return network.links
    .filter((l) => l.source === id || l.target === id)
    .map((l) => {
      const node = byId.get(l.source === id ? l.target : l.source);
      return node ? { node, value: l.value, strength: strengthOf(l.value) } : null;
    })
    .filter((p): p is Partner => p !== null)
    .sort((x, y) => y.value - x.value || x.node.name.localeCompare(y.node.name));
}

export function networkStats(network: Network) {
  const n = network.nodes.length;
  return {
    organisations: n,
    connections: network.links.length,
    meetings: network.meetings.length,
    avgConnections: n === 0 ? 0 : Math.round(((network.links.length * 2) / n) * 10) / 10,
  };
}

/** Rank by meetings, then by partners, then by name. */
export function rankNodes(nodes: NetworkNode[]): NetworkNode[] {
  return [...nodes].sort(
    (a, b) => b.meetings - a.meetings || b.degree - a.degree || a.name.localeCompare(b.name),
  );
}

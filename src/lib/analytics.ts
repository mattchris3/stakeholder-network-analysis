// Network analytics, ported from the original analytics/*.js.
// Pure functions over active members and confirmed meetings only: a pending
// or disputed meeting never moves a score.
import { linkKey } from './network';
import type { Entity, Meeting } from './types';

export interface AnalyticsInput {
  /** Active, approved members of one network. */
  members: Entity[];
  /** Confirmed meetings of the same network. */
  meetings: Meeting[];
}

export function analyticsInput(entities: Entity[], meetings: Meeting[], unityId: string): AnalyticsInput {
  return {
    members: entities.filter((e) => e.unityId === unityId && e.status === 'active' && e.approval === 'approved'),
    meetings: meetings.filter((m) => m.unityId === unityId && m.status === 'confirmed'),
  };
}

interface Pair {
  a: string;
  b: string;
  value: number;
}

function pairs(input: AnalyticsInput): Map<string, Pair> {
  const ids = new Set(input.members.map((m) => m.id));
  const map = new Map<string, Pair>();
  for (const m of input.meetings) {
    const p = [...new Set(m.participants)].filter((id) => ids.has(id));
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const [a, b] = [p[i], p[j]].sort();
        const key = linkKey(a, b);
        const pair = map.get(key) ?? { a, b, value: 0 };
        pair.value++;
        map.set(key, pair);
      }
    }
  }
  return map;
}

function partnerSets(input: AnalyticsInput, links = pairs(input)): Map<string, Set<string>> {
  const sets = new Map(input.members.map((m) => [m.id, new Set<string>()]));
  for (const { a, b } of links.values()) {
    sets.get(a)?.add(b);
    sets.get(b)?.add(a);
  }
  return sets;
}

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

// ── Overview ───────────────────────────────────────────────────────────────

export interface Collaborator {
  entity: Entity;
  meetings: number;
}

export interface Overview {
  meetings: Meeting[];
  collaborators: Collaborator[];
  topType: string | null;
  rank: number;
  ofTotal: number;
}

export function personalOverview(input: AnalyticsInput, orgId: string): Overview {
  const mine = input.meetings
    .filter((m) => m.participants.includes(orgId))
    .sort((a, b) => b.date.localeCompare(a.date));
  const byId = new Map(input.members.map((e) => [e.id, e]));

  const partnerCounts = countBy(
    mine.flatMap((m) => [...new Set(m.participants)].filter((p) => p !== orgId && byId.has(p))),
    (id) => id,
  );
  const collaborators = [...partnerCounts]
    .map(([id, meetings]) => ({ entity: byId.get(id)!, meetings }))
    .sort((x, y) => y.meetings - x.meetings || x.entity.name.localeCompare(y.entity.name));

  const types = [...countBy(mine, (m) => m.type ?? 'other')].sort((x, y) => y[1] - x[1]);

  const counts = countBy(input.meetings.flatMap((m) => [...new Set(m.participants)]), (id) => id);
  const mineCount = counts.get(orgId) ?? 0;
  // Rank = 1 + organisations with strictly more meetings, so ties share a rank.
  const rank = 1 + input.members.filter((e) => (counts.get(e.id) ?? 0) > mineCount).length;

  return { meetings: mine, collaborators, topType: types[0]?.[0] ?? null, rank, ofTotal: input.members.length };
}

// ── Influence ──────────────────────────────────────────────────────────────

export const INFLUENCE_WEIGHTS = { meetings: 0.35, partners: 0.4, bridge: 0.25 } as const;

export interface Influence {
  entity: Entity;
  meetings: number;
  partners: number;
  /** Extra organisations met through multi-party meetings: sum of (participants − 2). */
  bridge: number;
  /** Each factor's share of the 0–100 score. */
  parts: { meetings: number; partners: number; bridge: number };
  score: number;
}

export function influenceScores(input: AnalyticsInput): Influence[] {
  const ids = new Set(input.members.map((m) => m.id));
  const meetings = new Map<string, number>();
  const bridge = new Map<string, number>();
  for (const m of input.meetings) {
    const p = [...new Set(m.participants)].filter((id) => ids.has(id));
    for (const id of p) {
      meetings.set(id, (meetings.get(id) ?? 0) + 1);
      if (p.length > 2) bridge.set(id, (bridge.get(id) ?? 0) + p.length - 2);
    }
  }
  const partners = partnerSets(input);

  const max = (values: number[]) => Math.max(1, ...values);
  const maxM = max([...meetings.values()]);
  const maxP = max([...partners.values()].map((s) => s.size));
  const maxB = max([...bridge.values()]);

  return input.members
    .map((entity) => {
      const m = meetings.get(entity.id) ?? 0;
      const p = partners.get(entity.id)?.size ?? 0;
      const b = bridge.get(entity.id) ?? 0;
      const parts = {
        meetings: (m / maxM) * INFLUENCE_WEIGHTS.meetings * 100,
        partners: (p / maxP) * INFLUENCE_WEIGHTS.partners * 100,
        bridge: (b / maxB) * INFLUENCE_WEIGHTS.bridge * 100,
      };
      return {
        entity,
        meetings: m,
        partners: p,
        bridge: b,
        parts,
        score: Math.round(parts.meetings + parts.partners + parts.bridge),
      };
    })
    .sort((x, y) => y.score - x.score || x.entity.name.localeCompare(y.entity.name));
}

// ── Activity ───────────────────────────────────────────────────────────────

export interface MonthCount {
  month: string; // YYYY-MM
  count: number;
}

/** Meetings per month, with empty months filled in so gaps show as zero. */
export function monthlyActivity(meetings: Meeting[]): MonthCount[] {
  if (meetings.length === 0) return [];
  const counts = countBy(meetings, (m) => m.date.slice(0, 7));
  const months = [...counts.keys()].sort();
  const out: MonthCount[] = [];
  let [y, mo] = months[0].split('-').map(Number);
  const [endY, endM] = months[months.length - 1].split('-').map(Number);
  while (y < endY || (y === endY && mo <= endM)) {
    const key = `${y}-${String(mo).padStart(2, '0')}`;
    out.push({ month: key, count: counts.get(key) ?? 0 });
    mo++;
    if (mo > 12) {
      mo = 1;
      y++;
    }
  }
  return out;
}

export function breakdown(meetings: Meeting[], field: 'type' | 'format'): { key: string; count: number }[] {
  return [...countBy(meetings, (m) => m[field] ?? 'other')]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Insights: unique contribution ─────────────────────────────────────────

export type Level = 'critical' | 'high' | 'moderate' | 'low';

export interface Contribution {
  entity: Entity;
  score: number;
  level: Level;
  partners: number;
  /** Partners who meet nobody else in the network. */
  exclusivePartners: Entity[];
  /** Focus areas no other member covers. */
  uniqueFocusAreas: string[];
  /** Focus areas exactly one other member covers. */
  rareFocusAreas: string[];
  focusCoverage: { area: string; others: number }[];
  uniqueRole: boolean;
  hosted: number;
  meetings: number;
}

export function levelOf(score: number): Level {
  if (score >= 60) return 'critical';
  if (score >= 40) return 'high';
  if (score >= 20) return 'moderate';
  return 'low';
}

export function contributions(input: AnalyticsInput): Contribution[] {
  const links = pairs(input);
  const partners = partnerSets(input, links);
  const byId = new Map(input.members.map((e) => [e.id, e]));

  return input.members
    .map((entity) => {
      const id = entity.id;
      const mine = partners.get(id) ?? new Set<string>();
      const exclusive = [...mine].filter((p) => {
        const theirs = partners.get(p) ?? new Set();
        return theirs.size === 1 && theirs.has(id);
      });
      const focusCoverage = (entity.focusAreas ?? []).map((area) => ({
        area,
        others: input.members.filter((e) => e.id !== id && (e.focusAreas ?? []).includes(area)).length,
      }));
      const uniqueFocusAreas = focusCoverage.filter((f) => f.others === 0).map((f) => f.area);
      const rareFocusAreas = focusCoverage.filter((f) => f.others === 1).map((f) => f.area);
      const uniqueRole = !input.members.some((e) => e.id !== id && e.fundingType === entity.fundingType);

      const score = Math.min(
        100,
        exclusive.length * 25 +
          uniqueFocusAreas.length * 20 +
          rareFocusAreas.length * 10 +
          (uniqueRole ? 15 : 0) +
          Math.min(mine.size * 3, 30),
      );

      return {
        entity,
        score,
        level: levelOf(score),
        partners: mine.size,
        exclusivePartners: exclusive.map((p) => byId.get(p)!),
        uniqueFocusAreas,
        rareFocusAreas,
        focusCoverage,
        uniqueRole,
        hosted: input.meetings.filter((m) => m.hostId === id).length,
        meetings: input.meetings.filter((m) => m.participants.includes(id)).length,
      };
    })
    .sort((x, y) => y.score - x.score || x.entity.name.localeCompare(y.entity.name));
}

// ── Insights: bridges and gaps ────────────────────────────────────────────

export interface Bridge {
  a: Entity;
  b: Entity;
  meetings: number;
  sharedFocus: string[];
  crossSector: boolean;
  crossFocus: boolean;
}

/** Links between different sectors, or between members with no focus area in common. */
export function bridges(input: AnalyticsInput): Bridge[] {
  const byId = new Map(input.members.map((e) => [e.id, e]));
  const out: Bridge[] = [];
  for (const { a: aId, b: bId, value } of pairs(input).values()) {
    const a = byId.get(aId)!;
    const b = byId.get(bId)!;
    const sharedFocus = (a.focusAreas ?? []).filter((f) => (b.focusAreas ?? []).includes(f));
    const crossSector = a.sector !== b.sector;
    const crossFocus = sharedFocus.length === 0;
    if (crossSector || crossFocus) out.push({ a, b, meetings: value, sharedFocus, crossSector, crossFocus });
  }
  const both = (x: Bridge) => (x.crossSector && x.crossFocus ? 1 : 0);
  return out.sort((x, y) => both(y) - both(x) || y.meetings - x.meetings || x.a.name.localeCompare(y.a.name));
}

export interface Gap {
  a: Entity;
  b: Entity;
  sharedFocus: string[];
  mutualPartners: Entity[];
}

/** Members who share focus areas but have never had a confirmed meeting together. */
export function gaps(input: AnalyticsInput): Gap[] {
  const links = pairs(input);
  const partners = partnerSets(input, links);
  const byId = new Map(input.members.map((e) => [e.id, e]));
  const out: Gap[] = [];
  const ms = input.members;
  for (let i = 0; i < ms.length; i++) {
    for (let j = i + 1; j < ms.length; j++) {
      const a = ms[i];
      const b = ms[j];
      if (links.has(linkKey(a.id, b.id))) continue;
      const sharedFocus = (a.focusAreas ?? []).filter((f) => (b.focusAreas ?? []).includes(f));
      if (sharedFocus.length === 0) continue;
      const pb = partners.get(b.id) ?? new Set();
      const mutual = [...(partners.get(a.id) ?? [])].filter((p) => pb.has(p)).map((p) => byId.get(p)!);
      out.push({ a, b, sharedFocus, mutualPartners: mutual });
    }
  }
  return out.sort(
    (x, y) =>
      y.sharedFocus.length - x.sharedFocus.length ||
      y.mutualPartners.length - x.mutualPartners.length ||
      x.a.name.localeCompare(y.a.name),
  );
}

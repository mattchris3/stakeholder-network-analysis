import { useMemo, useState, type ReactNode } from 'react';
import { Drawer, EmptyState, Section } from '../../components/layout';
import { Button, Dot } from '../../components/ui';
import { bridges, contributions, gaps, type Contribution, type Level } from '../../lib/analytics';
import { plural } from '../../lib/format';
import { label, sectorColor } from '../../lib/sectors';
import type { Entity } from '../../lib/types';
import { useAnalytics } from './AnalyticsLayout';

const LEVEL: Record<Level, { text: string; className: string }> = {
  critical: { text: 'Critical', className: 'bg-danger-soft text-danger' },
  high: { text: 'High', className: 'bg-amber-50 text-amber-800' },
  moderate: { text: 'Moderate', className: 'bg-accent-soft text-accent-ink' },
  low: { text: 'Low', className: 'bg-sunken text-ink-soft' },
};

function Org({ e }: { e: Entity }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Dot color={sectorColor(e.sector ?? '')} />
      <span className="truncate font-medium">{e.name}</span>
    </span>
  );
}

function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-xs ${
        tone === 'accent' ? 'bg-accent-soft text-accent-ink' : 'border border-line text-ink-soft'
      }`}
    >
      {children}
    </span>
  );
}

function useShowMore(total: number, initial = 6) {
  const [all, setAll] = useState(false);
  return {
    limit: all ? total : initial,
    toggle:
      total > initial ? (
        <div className="border-t border-line-soft px-5 py-2">
          <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)}>
            {all ? 'Show fewer' : `Show all ${total}`}
          </Button>
        </div>
      ) : null,
  };
}

export default function Insights() {
  const { input } = useAnalytics();
  const contrib = useMemo(() => contributions(input), [input]);
  const bridgeList = useMemo(() => bridges(input), [input]);
  const gapList = useMemo(() => gaps(input), [input]);
  const [open, setOpen] = useState<Contribution | null>(null);
  const moreContrib = useShowMore(contrib.length, 8);
  const moreBridges = useShowMore(bridgeList.length);
  const moreGaps = useShowMore(gapList.length);

  return (
    <div className="space-y-4">
      <Section
        title="Unique contribution"
        description="What the network would lose without each member: partners who meet nobody else, focus areas no one else covers, and a funding role no one else plays. Select a row for the breakdown."
        flush
      >
        <ul className="divide-y divide-line-soft">
          {contrib.slice(0, moreContrib.limit).map((c) => (
            <li key={c.entity.id}>
              <button
                type="button"
                onClick={() => setOpen(c)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-sunken sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto_auto] sm:px-5"
              >
                <Org e={c.entity} />
                <span className="order-3 col-span-2 flex flex-wrap gap-1 sm:order-none sm:col-span-1">
                  {c.exclusivePartners.length > 0 && <Chip tone="accent">{plural(c.exclusivePartners.length, 'exclusive partner')}</Chip>}
                  {c.uniqueFocusAreas.length > 0 && <Chip tone="accent">{plural(c.uniqueFocusAreas.length, 'unique focus area')}</Chip>}
                  {c.rareFocusAreas.length > 0 && <Chip>{plural(c.rareFocusAreas.length, 'rare focus area')}</Chip>}
                  {c.uniqueRole && <Chip>Only {label(c.entity.fundingType)}</Chip>}
                </span>
                <span className={`hidden rounded px-1.5 py-0.5 text-[11px] font-medium sm:inline ${LEVEL[c.level].className}`}>
                  {LEVEL[c.level].text}
                </span>
                <span className="num w-8 text-right font-medium">{c.score}</span>
              </button>
            </li>
          ))}
        </ul>
        {moreContrib.toggle}
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          title="Bridges"
          description="Partnerships across sectors, or between members with no focus area in common. They carry ideas between domains."
          flush
        >
          {bridgeList.length === 0 ? (
            <EmptyState title="No bridges yet" body="Every partnership is within one sector and focus area." />
          ) : (
            <ul className="divide-y divide-line-soft">
              {bridgeList.slice(0, moreBridges.limit).map((b) => (
                <li key={`${b.a.id}|${b.b.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-sm sm:px-5">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <Org e={b.a} />
                    <span className="text-ink-muted" aria-label="and">↔</span>
                    <Org e={b.b} />
                  </span>
                  <span className="flex gap-1">
                    {b.crossSector && <Chip tone="accent">Cross-sector</Chip>}
                    {b.crossFocus && <Chip tone="accent">Cross-focus</Chip>}
                  </span>
                  <span className="num w-20 text-right text-xs text-ink-muted">{plural(b.meetings, 'meeting')}</span>
                </li>
              ))}
            </ul>
          )}
          {moreBridges.toggle}
        </Section>

        <Section
          title="Collaboration gaps"
          description="Members who share focus areas but have never had a verified meeting. Mutual partners could introduce them."
          flush
        >
          {gapList.length === 0 ? (
            <EmptyState title="No gaps found" body="Every pair with a focus area in common has already met." />
          ) : (
            <ul className="divide-y divide-line-soft">
              {gapList.slice(0, moreGaps.limit).map((g) => (
                <li key={`${g.a.id}|${g.b.id}`} className="px-4 py-3 text-sm sm:px-5">
                  <div className="flex items-center gap-2">
                    <Org e={g.a} />
                    <span className="text-ink-muted">+</span>
                    <Org e={g.b} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {g.sharedFocus.map((f) => (
                      <Chip key={f}>{f}</Chip>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    {g.mutualPartners.length > 0
                      ? `Could be introduced by ${g.mutualPartners.map((p) => p.name).join(', ')}`
                      : 'No mutual partners yet'}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {moreGaps.toggle}
        </Section>
      </div>

      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.entity.fullName ?? open?.entity.name}
        subtitle={open && `Unique contribution ${open.score} / 100 · ${LEVEL[open.level].text}`}
      >
        {open && <ContributionDetail c={open} />}
      </Drawer>
    </div>
  );
}

function ContributionDetail({ c }: { c: Contribution }) {
  const rows = [
    { label: 'Exclusive partners', detail: '25 points each', points: c.exclusivePartners.length * 25 },
    { label: 'Unique focus areas', detail: '20 points each', points: c.uniqueFocusAreas.length * 20 },
    { label: 'Rare focus areas', detail: '10 points each', points: c.rareFocusAreas.length * 10 },
    { label: 'Only member in its funding role', detail: '15 points', points: c.uniqueRole ? 15 : 0 },
    { label: 'Partners', detail: '3 points each, up to 30', points: Math.min(c.partners * 3, 30) },
  ];
  return (
    <div className="divide-y divide-line">
      <div className="px-5 py-4">
        <h3 className="text-xs font-medium text-ink-muted">How the score adds up</h3>
        <dl className="mt-2 space-y-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4">
              <dt>
                {r.label} <span className="text-xs text-ink-muted">· {r.detail}</span>
              </dt>
              <dd className={`num ${r.points ? 'text-ink' : 'text-ink-muted'}`}>+{r.points}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-2 font-medium">
            <dt>Total (capped at 100)</dt>
            <dd className="num">{c.score}</dd>
          </div>
        </dl>
      </div>

      <div className="px-5 py-4">
        <h3 className="text-xs font-medium text-ink-muted">Exclusive partners</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {c.exclusivePartners.length > 0
            ? `${c.exclusivePartners.map((p) => p.name).join(', ')} ${c.exclusivePartners.length === 1 ? 'meets' : 'meet'} no other member.`
            : 'Every partner also works with other members.'}
        </p>
      </div>

      <div className="px-5 py-4">
        <h3 className="text-xs font-medium text-ink-muted">Focus area coverage</h3>
        <ul className="mt-2 space-y-2">
          {c.focusCoverage.map((f) => {
            const tone = f.others === 0 ? 'bg-danger' : f.others === 1 ? 'bg-amber-500' : 'bg-zinc-300';
            const text = f.others === 0 ? 'Only provider' : f.others === 1 ? '1 other member' : `${f.others} other members`;
            return (
              <li key={f.area} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span>{f.area}</span>
                  <span className="text-xs text-ink-muted">{text}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-line-soft">
                  <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(12, 100 / (f.others + 1))}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-line">
        {[
          ['Meetings', c.meetings],
          ['Hosted', c.hosted],
          ['Partners', c.partners],
        ].map(([k, v]) => (
          <div key={k} className="px-5 py-3">
            <dt className="text-xs text-ink-muted">{k}</dt>
            <dd className="num mt-0.5 text-lg font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useShell } from '../components/AppShell';
import NetworkGraph, { type Layout } from '../components/NetworkGraph';
import NetworkPanel from '../components/NetworkPanel';
import { Button, Dot } from '../components/ui';
import {
  DEFAULT_FILTERS,
  buildNetwork,
  filterNetwork,
  networkStats,
  type NetworkFilters,
  type Period,
  type StrengthFilter,
} from '../lib/network';
import { FUNDING_COLORS, label, sectorColor } from '../lib/sectors';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '12', label: 'Last 12 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '3', label: 'Last 3 months' },
  { value: '1', label: 'Last month' },
];
const STRENGTHS: { value: StrengthFilter; label: string }[] = [
  { value: 'all', label: 'Any strength' },
  { value: 'strong', label: 'Strong (6+ meetings)' },
  { value: 'medium', label: 'Medium (3–5)' },
  { value: 'weak', label: 'Weak (1–2)' },
];
const LAYOUTS: { value: Layout; label: string }[] = [
  { value: 'core', label: 'Core' },
  { value: 'sector', label: 'By sector' },
  { value: 'funding', label: 'By funding' },
];

export default function NetworkPage() {
  const { session, data } = useShell();
  const [filters, setFilters] = useState<NetworkFilters>(DEFAULT_FILTERS);
  const [layout, setLayout] = useState<Layout>('core');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const full = useMemo(
    () => buildNetwork(data.entities, data.meetings, session.unityId),
    [data, session.unityId],
  );
  const view = useMemo(() => filterNetwork(full, filters), [full, filters]);
  const stats = networkStats(view);
  const sectors = useMemo(() => [...new Set(full.nodes.map((n) => n.sector))].sort(), [full]);
  const visibleSectors = useMemo(() => [...new Set(view.nodes.map((n) => n.sector))].sort(), [view]);

  const set = <K extends keyof NetworkFilters>(key: K, value: NetworkFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const filtered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  const selected = selectedId && view.nodes.some((n) => n.id === selectedId) ? selectedId : null;

  const STAT_CARDS = [
    { label: 'Organisations', value: stats.organisations },
    { label: 'Connections', value: stats.connections },
    { label: 'Verified meetings', value: stats.meetings },
    { label: 'Avg. connections', value: stats.avgConnections.toFixed(1) },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{data.unity?.name ?? 'Network'}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Links are meetings every participant has verified.
          </p>
        </div>
        <div role="radiogroup" aria-label="Layout" className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              type="button"
              role="radio"
              aria-checked={layout === l.value}
              onClick={() => setLayout(l.value)}
              className={`relative h-8 rounded-md px-3 text-[13px] font-medium transition-colors ${
                layout === l.value ? 'text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {layout === l.value && (
                <motion.span
                  layoutId="layout-pill"
                  className="absolute inset-0 rounded-md bg-sunken"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="card px-4 py-3">
            <dt className="text-xs text-ink-muted">{s.label}</dt>
            <dd className="num mt-1 text-2xl font-medium tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="card flex flex-wrap items-center gap-2 p-2">
        <input
          className="field h-9 w-full sm:w-44"
          placeholder="Organisation"
          aria-label="Search for an organisation"
          value={filters.searchA}
          onChange={(e) => set('searchA', e.target.value)}
        />
        <span className="hidden text-xs text-ink-muted sm:inline">and</span>
        <input
          className="field h-9 w-full sm:w-44"
          placeholder="Partner"
          aria-label="Search for a second organisation"
          value={filters.searchB}
          onChange={(e) => set('searchB', e.target.value)}
        />
        <span className="mx-1 hidden h-6 w-px bg-line md:block" />
        <select className="field h-9 w-auto" aria-label="Sector" value={filters.sector} onChange={(e) => set('sector', e.target.value)}>
          <option value="all">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select
          className="field h-9 w-auto"
          aria-label="Connection strength"
          value={filters.strength}
          onChange={(e) => set('strength', e.target.value as StrengthFilter)}
        >
          {STRENGTHS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="field h-9 w-auto"
          aria-label="Time period"
          value={filters.period}
          onChange={(e) => set('period', e.target.value as Period)}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <label className="ml-1 inline-flex h-9 cursor-pointer items-center gap-2 text-[13px] text-ink-soft select-none">
          <input
            type="checkbox"
            className="size-4 accent-accent"
            checked={filters.showIsolated}
            onChange={(e) => set('showIsolated', e.target.checked)}
          />
          Show unconnected
        </label>
        <AnimatePresence>
          {filtered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-auto">
              <Button size="sm" variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card relative min-h-[480px] overflow-hidden lg:min-h-[560px]" aria-label="Network graph">
          {view.nodes.length > 0 ? (
            <NetworkGraph
              nodes={view.nodes}
              links={view.links}
              layout={layout}
              selectedId={selected}
              homeId={session.orgId}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No organisations match these filters</p>
              <p className="mt-1 max-w-xs text-sm text-ink-muted">Widen the period or strength, or clear the search.</p>
              <Button size="sm" className="mt-4" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </Button>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-x-3 gap-y-1.5 rounded-lg border border-line bg-surface/90 px-3 py-2 text-xs text-ink-soft backdrop-blur">
            {layout === 'funding'
              ? Object.entries(FUNDING_COLORS).map(([k, c]) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <Dot color={c} />
                    {label(k)}
                  </span>
                ))
              : visibleSectors.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <Dot color={sectorColor(s)} />
                    {label(s)}
                  </span>
                ))}
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <svg width="28" height="8" aria-hidden="true">
                <line x1="1" y1="4" x2="27" y2="4" stroke="#CFCBC7" strokeWidth="1.5" />
              </svg>
              thicker = more meetings
            </span>
          </div>
        </section>

        <NetworkPanel network={view} selectedId={selected} homeId={session.orgId} onSelect={setSelectedId} />
      </div>

      <p className="text-xs text-ink-muted">
        {data.source === 'firebase' ? 'Live data from Firebase.' : 'Showing the bundled demo snapshot (Firebase was unreachable).'}
        {filters.period !== 'all' && ' Periods count back from the most recent verified meeting.'}
      </p>
    </div>
  );
}

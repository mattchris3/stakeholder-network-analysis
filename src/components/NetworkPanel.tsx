import { AnimatePresence, motion } from 'motion/react';
import { partnersOf, rankNodes, type Network } from '../lib/network';
import { label, sectorColor } from '../lib/sectors';
import { Badge, Dot } from './ui';

interface Props {
  network: Network;
  selectedId: string | null;
  homeId: string;
  onSelect: (id: string | null) => void;
}

const STRENGTH_STYLE = {
  strong: 'bg-accent-soft text-accent-ink',
  medium: 'bg-sunken text-ink-soft',
  weak: 'bg-transparent text-ink-muted',
} as const;

const slide = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

export default function NetworkPanel({ network, selectedId, homeId, onSelect }: Props) {
  const node = selectedId ? network.nodes.find((n) => n.id === selectedId) : undefined;

  return (
    <aside className="card flex min-h-0 flex-col overflow-hidden lg:max-h-[calc(100dvh-14rem)]" aria-live="polite" data-tour="panel">
      <AnimatePresence mode="wait" initial={false}>
        {node ? (
          <motion.div key={node.id} {...slide} className="flex min-h-0 flex-1 flex-col">
            <Details node={node} network={network} homeId={homeId} onSelect={onSelect} />
          </motion.div>
        ) : (
          <motion.div key="overview" {...slide} className="flex min-h-0 flex-1 flex-col">
            <Overview network={network} homeId={homeId} onSelect={onSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function Overview({ network, homeId, onSelect }: Omit<Props, 'selectedId'>) {
  const ranked = rankNodes(network.nodes).slice(0, 10);
  const top = ranked[0]?.meetings || 1;
  return (
    <>
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Most active organisations</h2>
        <p className="text-xs text-ink-muted">Select one, or a node in the graph, to see its partners.</p>
      </div>
      <ol className="min-h-0 flex-1 overflow-y-auto p-2">
        {ranked.map((n, i) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onSelect(n.id)}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sunken"
            >
              <span className="num w-5 text-xs text-ink-muted">{i + 1}</span>
              <Dot color={sectorColor(n.sector)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {n.name}
                  {n.id === homeId && <span className="ml-1.5 text-xs font-normal text-accent">you</span>}
                </span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-line-soft">
                  <motion.span
                    className="block h-full rounded-full bg-zinc-300 group-hover:bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${(n.meetings / top) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              </span>
              <span className="num text-sm text-ink-soft">{n.meetings}</span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

function Details({
  node,
  network,
  homeId,
  onSelect,
}: {
  node: Network['nodes'][number];
  network: Network;
  homeId: string;
  onSelect: (id: string | null) => void;
}) {
  const partners = partnersOf(network, node.id);
  const strong = partners.filter((p) => p.strength === 'strong').length;
  const e = node.entity;

  return (
    <>
      <div className="border-b border-line px-4 pt-3 pb-4">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="-ml-1 mb-2 inline-flex h-7 items-center gap-1 rounded-md px-1 text-xs text-ink-muted hover:text-ink"
        >
          <span aria-hidden="true">←</span> All organisations
        </button>
        <div className="flex items-start gap-3">
          <span
            className="mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-surface"
            style={{ background: sectorColor(node.sector), boxShadow: `0 0 0 5px ${sectorColor(node.sector)}22` }}
          />
          <div className="min-w-0">
            <h2 className="text-base leading-snug font-semibold">{node.fullName}</h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge>{label(node.sector)}</Badge>
              {e.type && <Badge>{label(e.type)}</Badge>}
              {node.id === homeId && <Badge tone="accent">Your organisation</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            ['Meetings', node.meetings],
            ['Partners', partners.length],
            ['Strong links', strong],
          ].map(([k, v]) => (
            <div key={k} className="px-4 py-3">
              <dt className="text-xs text-ink-muted">{k}</dt>
              <dd className="num mt-0.5 text-lg font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {e.description && (
          <p className="line-clamp-4 border-b border-line px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
            {e.description}
          </p>
        )}

        {(e.region || e.location || e.focusAreas?.length) && (
          <dl className="space-y-2 border-b border-line px-4 py-3 text-[13px]">
            {e.location && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Based in</dt>
                <dd className="text-right">{e.location}</dd>
              </div>
            )}
            {e.region && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Region</dt>
                <dd>{label(e.region)}</dd>
              </div>
            )}
            {e.focusAreas && e.focusAreas.length > 0 && (
              <div>
                <dt className="text-ink-muted">Focus areas</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1">
                  {e.focusAreas.map((f) => (
                    <span key={f} className="rounded-md border border-line px-1.5 py-0.5 text-xs text-ink-soft">
                      {f}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}

        <div className="px-4 pt-3 pb-1">
          <h3 className="text-xs font-medium text-ink-muted">Partners</h3>
        </div>
        {partners.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-muted">No verified meetings with other members in this view.</p>
        ) : (
          <ul className="p-2 pt-0">
            {partners.map((p) => (
              <li key={p.node.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p.node.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sunken"
                >
                  <Dot color={sectorColor(p.node.sector)} />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.node.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STRENGTH_STYLE[p.strength]}`}>
                    {p.strength}
                  </span>
                  <span className="num w-6 text-right text-sm text-ink-soft">{p.value}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

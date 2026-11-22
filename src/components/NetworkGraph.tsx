import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { NetworkLink, NetworkNode } from '../lib/network';
import { label as niceLabel, fundingColor, sectorColor } from '../lib/sectors';

export type Layout = 'core' | 'sector' | 'funding';

type SimNode = NetworkNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { key: string; value: number };

interface Props {
  nodes: NetworkNode[];
  links: NetworkLink[];
  layout: Layout;
  selectedId: string | null;
  homeId?: string;
  onSelect: (id: string | null) => void;
}

const ACCENT = '#4F46E5';
const LINK = '#CFCBC7';
const PAD = 28;

export const nodeRadius = (n: { meetings: number }) => 7 + Math.sqrt(n.meetings) * 2.6;
const linkWidth = (v: number) => 1 + Math.sqrt(v) * 1.1;
const linkOpacity = (v: number) => (v >= 6 ? 0.95 : v >= 3 ? 0.75 : 0.5);

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function NetworkGraph({ nodes, links, layout, selectedId, homeId, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const hoverId = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(selectedId);
  const linksRef = useRef<SimLink[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tip, setTip] = useState<{ node: SimNode; x: number; y: number } | null>(null);

  // Track the container size.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dim everything that isn't the focused node or one of its partners.
  const applyFocus = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const focus = hoverId.current ?? selectedRef.current;
    const neighbours = new Set<string>();
    if (focus) {
      neighbours.add(focus);
      for (const l of linksRef.current) {
        const s = (l.source as SimNode).id;
        const t = (l.target as SimNode).id;
        if (s === focus) neighbours.add(t);
        if (t === focus) neighbours.add(s);
      }
    }
    svg
      .selectAll<SVGLineElement, SimLink>('line.graph-link')
      .attr('stroke', (d) => {
        const hit = focus && ((d.source as SimNode).id === focus || (d.target as SimNode).id === focus);
        return hit ? ACCENT : LINK;
      })
      .attr('stroke-opacity', (d) => {
        if (!focus) return linkOpacity(d.value);
        const hit = (d.source as SimNode).id === focus || (d.target as SimNode).id === focus;
        return hit ? 0.85 : 0.08;
      });
    svg
      .selectAll<SVGGElement, SimNode>('g.graph-node')
      .classed('is-selected', (d) => d.id === selectedRef.current)
      .each(function (d) {
        const dim = focus !== null && !neighbours.has(d.id);
        const g = d3.select(this);
        g.select('circle.body').style('opacity', dim ? 0.18 : 1);
        g.select('text').style('opacity', dim ? 0.25 : 1);
        g.select('circle.ring').attr('stroke-opacity', d.id === selectedRef.current ? 1 : 0);
      });
  }, []);

  // Zoom: set up once.
  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    const layer = svg.select<SVGGElement>('g.zoom-layer');
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 4])
      .on('zoom', (event) => layer.attr('transform', event.transform.toString()));
    svg.call(zoom).on('dblclick.zoom', null);
    svg.on('click', () => onSelectRef.current(null));
    zoomRef.current = zoom;
  }, []);

  // Build or update the simulation whenever the data, layout or size changes.
  useEffect(() => {
    const { w, h } = size;
    if (w === 0 || h === 0) return;
    const reduced = prefersReducedMotion();
    const svg = d3.select(svgRef.current!);
    const scale = Math.max(0.6, Math.min(1.3, Math.min(w, h) / 620));
    const colour = (d: NetworkNode) => (layout === 'funding' ? fundingColor(d.fundingType) : sectorColor(d.sector));

    const simNodes: SimNode[] = nodes.map((n) => {
      const prev = positions.current.get(n.id);
      return {
        ...n,
        x: prev?.x ?? w / 2 + (Math.random() - 0.5) * w * 0.4,
        y: prev?.y ?? h / 2 + (Math.random() - 0.5) * h * 0.4,
      };
    });
    const simLinks: SimLink[] = links.map((l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
      key: `${l.source}|${l.target}`,
    }));
    linksRef.current = simLinks;

    // Forces: well-connected organisations sit at the core; or cluster by group.
    const maxDegree = Math.max(1, ...nodes.map((n) => n.degree));
    let fx: d3.ForceX<SimNode>;
    let fy: d3.ForceY<SimNode>;
    if (layout === 'core') {
      const pull = (d: SimNode) => 0.015 + 0.22 * Math.pow(d.degree / maxDegree, 2);
      fx = d3.forceX<SimNode>(w / 2).strength(pull);
      fy = d3.forceY<SimNode>(h / 2).strength(pull);
    } else {
      const key = layout === 'sector' ? 'sector' : 'fundingType';
      const groups = [...new Set(nodes.map((n) => n[key]))].sort();
      const orbit = Math.min(w, h) * 0.3;
      const centres = new Map(
        groups.map((g, i) => {
          const a = (2 * Math.PI * i) / groups.length - Math.PI / 2;
          return [g, { x: w / 2 + orbit * Math.cos(a), y: h / 2 + orbit * Math.sin(a) }];
        }),
      );
      fx = d3.forceX<SimNode>((d) => centres.get(d[key])!.x).strength(0.7);
      fy = d3.forceY<SimNode>((d) => centres.get(d[key])!.y).strength(0.7);
    }

    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((layout === 'core' ? 190 : 90) * scale)
          .strength(layout === 'core' ? 0.05 : 0.005),
      )
      .force('charge', d3.forceManyBody<SimNode>().strength((layout === 'core' ? -620 : -160) * scale))
      .force('collide', d3.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 26).strength(0.9))
      .force('x', fx)
      .force('y', fy);

    // Links
    const linkSel = svg
      .select('g.links')
      .selectAll<SVGLineElement, SimLink>('line.graph-link')
      .data(simLinks, (d) => d.key)
      .join(
        (enter) => enter.append('line').attr('class', 'graph-link').attr('stroke-linecap', 'round').attr('stroke-opacity', 0),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr('stroke-width', (d) => linkWidth(d.value));

    // Nodes
    const nodeSel = svg
      .select('g.nodes')
      .selectAll<SVGGElement, SimNode>('g.graph-node')
      .data(simNodes, (d) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append('g')
            .attr('class', 'graph-node')
            .attr('tabindex', 0)
            .attr('role', 'button');
          g.append('circle').attr('class', 'ring').attr('fill', 'none').attr('stroke', ACCENT).attr('stroke-width', 2.5).attr('stroke-opacity', 0);
          g.append('circle').attr('class', 'body').attr('r', 0).attr('stroke', '#fff').attr('stroke-width', 2);
          g.append('text').attr('text-anchor', 'middle').attr('font-size', 11.5).attr('font-weight', 500).attr('fill', '#18181B');
          return g;
        },
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr('aria-label', (d) => `${d.fullName}, ${niceLabel(d.sector)}, ${d.meetings} meetings`);

    nodeSel.select<SVGCircleElement>('circle.ring').attr('r', (d) => nodeRadius(d) + 5);
    const body = nodeSel.select<SVGCircleElement>('circle.body').attr('fill', colour);
    (reduced ? body : body.transition().duration(500).ease(d3.easeCubicOut).delay((_, i) => i * 18)).attr('r', nodeRadius);
    nodeSel
      .select('text')
      .text((d) => (d.id === homeId ? `${d.name} (you)` : d.name))
      .attr('dy', (d) => nodeRadius(d) + 15);

    // Interaction
    nodeSel
      .on('mouseenter', (event: MouseEvent, d) => {
        hoverId.current = d.id;
        applyFocus();
        const box = wrapRef.current!.getBoundingClientRect();
        setTip({ node: d, x: event.clientX - box.left, y: event.clientY - box.top });
      })
      .on('mousemove', (event: MouseEvent, d) => {
        const box = wrapRef.current!.getBoundingClientRect();
        setTip({ node: d, x: event.clientX - box.left, y: event.clientY - box.top });
      })
      .on('mouseleave', () => {
        hoverId.current = null;
        applyFocus();
        setTip(null);
      })
      .on('click', (event: MouseEvent, d) => {
        event.stopPropagation();
        onSelectRef.current(d.id);
      })
      .on('keydown', (event: KeyboardEvent, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectRef.current(d.id);
        }
      })
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    const render = () => {
      for (const d of simNodes) {
        const r = nodeRadius(d) + PAD;
        d.x = Math.max(r, Math.min(w - r, d.x ?? 0));
        d.y = Math.max(r, Math.min(h - r - 36, d.y ?? 0)); // clear of the legend
      }
      linkSel
        .attr('x1', (d) => (d.source as SimNode).x!)
        .attr('y1', (d) => (d.source as SimNode).y!)
        .attr('x2', (d) => (d.target as SimNode).x!)
        .attr('y2', (d) => (d.target as SimNode).y!);
      nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
    };

    if (reduced) {
      sim.stop();
      sim.tick(300);
      render();
    } else {
      sim.on('tick', render);
      sim.alpha(positions.current.size > 0 ? 0.6 : 1).restart();
    }
    applyFocus();

    return () => {
      sim.stop();
      for (const d of simNodes) positions.current.set(d.id, { x: d.x ?? 0, y: d.y ?? 0 });
    };
  }, [nodes, links, layout, size, homeId, applyFocus]);

  // Selection changes only restyle; they never restart the layout.
  useEffect(() => {
    selectedRef.current = selectedId;
    applyFocus();
  }, [selectedId, applyFocus]);

  const zoomBy = (k: number) => {
    const svg = d3.select(svgRef.current!);
    svg.transition().duration(250).call(zoomRef.current!.scaleBy, k);
  };
  const resetZoom = () => {
    const svg = d3.select(svgRef.current!);
    svg.transition().duration(400).call(zoomRef.current!.transform, d3.zoomIdentity);
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <svg ref={svgRef} width={size.w} height={size.h} className="block cursor-grab active:cursor-grabbing">
        <g className="zoom-layer">
          <g className="links" />
          <g className="nodes" />
        </g>
      </svg>

      <div className="absolute top-3 right-3 flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
        {[
          { label: 'Zoom in', icon: 'M8 3v10M3 8h10', fn: () => zoomBy(1.3) },
          { label: 'Zoom out', icon: 'M3 8h10', fn: () => zoomBy(1 / 1.3) },
          { label: 'Reset view', icon: 'M2.5 6V2.5H6M13.5 10v3.5H10M2.5 2.5l4 4M13.5 13.5l-4-4', fn: resetZoom },
        ].map((b, i) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={b.fn}
            className={`grid size-8 place-items-center text-ink-soft transition-colors hover:bg-sunken hover:text-ink ${
              i > 0 ? 'border-t border-line' : ''
            }`}
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d={b.icon} />
            </svg>
          </button>
        ))}
      </div>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 w-52 rounded-lg border border-line bg-surface px-3 py-2.5 text-xs shadow-lg shadow-black/5"
          style={{
            left: Math.min(tip.x + 14, size.w - 220),
            top: Math.max(tip.y - 10, 8),
          }}
        >
          <p className="text-[13px] font-semibold text-ink">{tip.node.fullName}</p>
          <p className="mt-0.5 text-ink-muted">{niceLabel(tip.node.sector)}</p>
          <div className="mt-2 flex justify-between border-t border-line-soft pt-2">
            <span className="text-ink-muted">Meetings</span>
            <span className="num text-ink">{tip.node.meetings}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-ink-muted">Partners</span>
            <span className="num text-ink">{tip.node.degree}</span>
          </div>
        </div>
      )}
    </div>
  );
}

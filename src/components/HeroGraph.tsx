import { motion } from 'motion/react';
import { SECTOR_COLORS } from '../lib/sectors';

// A small, hand-placed network for the landing page. It draws itself in once,
// then highlights one organisation's partners, the same interaction as the app.
const NODES = [
  { id: 'a', x: 250, y: 190, r: 22, c: SECTOR_COLORS.healthcare, label: 'WHO' },
  { id: 'b', x: 140, y: 110, r: 14, c: SECTOR_COLORS.nonprofit, label: 'UNICEF' },
  { id: 'c', x: 375, y: 100, r: 16, c: SECTOR_COLORS.business, label: 'Gates Fdn' },
  { id: 'd', x: 400, y: 250, r: 12, c: SECTOR_COLORS.banking, label: 'World Bank' },
  { id: 'e', x: 120, y: 270, r: 13, c: SECTOR_COLORS.government, label: 'CDC' },
  { id: 'f', x: 260, y: 330, r: 10, c: SECTOR_COLORS.education, label: 'Oxford' },
  { id: 'g', x: 470, y: 170, r: 8, c: SECTOR_COLORS.technology, label: '' },
  { id: 'h', x: 60, y: 180, r: 7, c: SECTOR_COLORS.education, label: '' },
  { id: 'i', x: 340, y: 360, r: 7, c: SECTOR_COLORS.technology, label: '' },
] as const;

const LINKS: [string, string, number][] = [
  ['a', 'b', 4], ['a', 'c', 3], ['a', 'd', 2], ['a', 'e', 4], ['a', 'f', 2],
  ['b', 'e', 2], ['c', 'd', 2], ['c', 'g', 1], ['b', 'h', 1], ['f', 'i', 1], ['d', 'i', 1], ['e', 'h', 1],
];

const pos = Object.fromEntries(NODES.map((n) => [n.id, n]));

export default function HeroGraph() {
  return (
    <svg viewBox="0 0 520 420" className="h-auto w-full" role="img" aria-labelledby="hero-graph-title">
      <title id="hero-graph-title">A network of organisations with WHO's partnerships highlighted</title>
      <g>
        {LINKS.map(([s, t, w], i) => {
          const focus = s === 'a' || t === 'a';
          return (
            <motion.line
              key={`${s}${t}`}
              x1={pos[s].x}
              y1={pos[s].y}
              x2={pos[t].x}
              y2={pos[t].y}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0, stroke: '#D6D3D1' }}
              animate={{
                pathLength: 1,
                opacity: focus ? 0.85 : 0.6,
                stroke: focus ? '#4F46E5' : '#D6D3D1',
              }}
              transition={{
                pathLength: { duration: 0.7, delay: 0.25 + i * 0.05, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.3, delay: 0.25 + i * 0.05 },
                stroke: { duration: 0.5, delay: 1.6 },
              }}
              strokeWidth={1 + w * 0.7}
            />
          );
        })}
      </g>
      <g>
        {NODES.map((n, i) => (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            {n.id === 'a' && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={n.r + 7}
                fill="none"
                stroke="#4F46E5"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ delay: 1.6, duration: 0.5 }}
              />
            )}
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} stroke="#fff" strokeWidth={2} />
            {n.label && (
              <text
                x={n.x}
                y={n.y + n.r + 15}
                textAnchor="middle"
                className="fill-ink text-[12px] font-medium"
                style={{ paintOrder: 'stroke', stroke: '#FAFAF8', strokeWidth: 4 }}
              >
                {n.label}
              </text>
            )}
          </motion.g>
        ))}
      </g>
    </svg>
  );
}

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Section } from '../../components/layout';
import { Dot } from '../../components/ui';
import { INFLUENCE_WEIGHTS, influenceScores } from '../../lib/analytics';
import { label, sectorColor } from '../../lib/sectors';
import { useAnalytics } from './AnalyticsLayout';

const PARTS = [
  { key: 'partners', name: `Partners (${INFLUENCE_WEIGHTS.partners * 100}%)`, color: '#4F46E5' },
  { key: 'meetings', name: `Meetings (${INFLUENCE_WEIGHTS.meetings * 100}%)`, color: '#818CF8' },
  { key: 'bridge', name: `Multi-party (${INFLUENCE_WEIGHTS.bridge * 100}%)`, color: '#C7D2FE' },
] as const;

export default function Influence() {
  const { input, session } = useAnalytics();
  const scores = useMemo(() => influenceScores(input), [input]);
  const chart = scores.slice(0, 10).map((s) => ({
    name: s.entity.name,
    partners: Math.round(s.parts.partners),
    meetings: Math.round(s.parts.meetings),
    bridge: Math.round(s.parts.bridge),
    score: s.score,
  }));

  return (
    <div className="space-y-4">
      <Section
        title="Influence score"
        description="0–100, from how many different members an organisation works with (40%), how often it meets (35%), and how often it brings three or more members together (25%). Each factor is scaled against the network's leader."
      >
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink-soft">
          {PARTS.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: p.color }} />
              {p.name}
            </span>
          ))}
        </div>
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke="#F1F0EE" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B6B73' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#18181B' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#F4F4F2' }}
                contentStyle={{ borderRadius: 8, border: '1px solid #E7E5E4', fontSize: 12 }}
                formatter={(v, n) => [v, PARTS.find((p) => p.key === n)?.name ?? n]}
              />
              {PARTS.map((p, i) => (
                <Bar
                  key={p.key}
                  dataKey={p.key}
                  stackId="s"
                  fill={p.color}
                  radius={i === PARTS.length - 1 ? [0, 4, 4, 0] : 0}
                  animationDuration={700}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="All members" flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="py-2.5 pr-3 pl-5 font-medium">#</th>
                <th className="px-3 font-medium">Organisation</th>
                <th className="px-3 text-right font-medium">Meetings</th>
                <th className="px-3 text-right font-medium">Partners</th>
                <th className="px-3 text-right font-medium">Multi-party</th>
                <th className="w-48 pr-5 pl-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {scores.map((s, i) => (
                <tr key={s.entity.id} className={s.entity.id === session.orgId ? 'bg-accent-soft/50' : ''}>
                  <td className="num py-2.5 pr-3 pl-5 text-ink-muted">{i + 1}</td>
                  <td className="px-3">
                    <span className="flex items-center gap-2">
                      <Dot color={sectorColor(s.entity.sector ?? '')} />
                      <span className="font-medium">{s.entity.name}</span>
                      <span className="hidden text-ink-muted md:inline">{label(s.entity.sector)}</span>
                    </span>
                  </td>
                  <td className="num px-3 text-right">{s.meetings}</td>
                  <td className="num px-3 text-right">{s.partners}</td>
                  <td className="num px-3 text-right">{s.bridge}</td>
                  <td className="pr-5 pl-3">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 flex-1 rounded-full bg-line-soft">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${s.score}%` }} />
                      </span>
                      <span className="num w-7 text-right font-medium">{s.score}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

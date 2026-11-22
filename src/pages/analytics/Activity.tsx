import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarList, Section } from '../../components/layout';
import { breakdown, monthlyActivity } from '../../lib/analytics';
import { formatMonth } from '../../lib/format';
import { label } from '../../lib/sectors';
import { useAnalytics } from './AnalyticsLayout';

export default function Activity() {
  const { input } = useAnalytics();
  const months = useMemo(() => monthlyActivity(input.meetings).map((m) => ({ ...m, label: formatMonth(m.month) })), [input]);
  const types = useMemo(() => breakdown(input.meetings, 'type'), [input]);
  const formats = useMemo(() => breakdown(input.meetings, 'format'), [input]);
  const total = input.meetings.length || 1;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

  return (
    <div className="space-y-4">
      <Section title="Verified meetings per month" description="Across the whole network. Months with no meetings show as zero.">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F0EE" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B73' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B6B73' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E7E5E4', fontSize: 12 }}
                formatter={(v) => [v, 'Meetings']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#4F46E5"
                strokeWidth={2}
                fill="url(#activityFill)"
                dot={{ r: 3, fill: '#4F46E5', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="By type" description="What meetings were for.">
          <BarList items={types.map((t) => ({ key: t.key, label: label(t.key), value: t.count }))} format={(n) => `${n} · ${pct(n)}`} />
        </Section>
        <Section title="By format" description="How members met.">
          <BarList
            color="#0EA5A4"
            items={formats.map((t) => ({ key: t.key, label: label(t.key), value: t.count }))}
            format={(n) => `${n} · ${pct(n)}`}
          />
        </Section>
      </div>
    </div>
  );
}

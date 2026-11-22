import { useMemo, useState } from 'react';
import { EmptyState, Section } from '../../components/layout';
import { Button, Dot } from '../../components/ui';
import { label, sectorColor } from '../../lib/sectors';
import type { Entity } from '../../lib/types';
import { useAdmin } from './AdminLayout';
import OrgDrawer from './OrgDrawer';

export default function Members() {
  const { active, inactive, requestAction, data } = useAdmin();
  const [open, setOpen] = useState<Entity | null>(null);
  const [query, setQuery] = useState('');

  const meetingCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const m of data.meetings) if (m.status === 'confirmed') for (const p of m.participants) c.set(p, (c.get(p) ?? 0) + 1);
    return c;
  }, [data.meetings]);

  const q = query.trim().toLowerCase();
  const shown = active
    .filter((e) => !q || e.name.toLowerCase().includes(q) || (e.fullName ?? '').toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <Section
        title="Active members"
        description={`${active.length} organisations.`}
        actions={<input className="field h-8 w-52 text-[13px]" placeholder="Search members" aria-label="Search members" value={query} onChange={(e) => setQuery(e.target.value)} />}
        flush
      >
        {shown.length === 0 ? (
          <EmptyState title="No members match" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-muted">
                  <th className="py-2.5 pr-3 pl-5 font-medium">Organisation</th>
                  <th className="px-3 font-medium">Member ID</th>
                  <th className="px-3 font-medium">Sector</th>
                  <th className="px-3 text-right font-medium">Meetings</th>
                  <th className="pr-5 pl-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {shown.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-3 pl-5">
                      <button type="button" className="flex items-center gap-2 text-left font-medium hover:text-accent" onClick={() => setOpen(e)}>
                        <Dot color={sectorColor(e.sector ?? '')} />
                        {e.name}
                      </button>
                    </td>
                    <td className="num px-3 text-ink-soft">{e.id}</td>
                    <td className="px-3 text-ink-soft">{label(e.sector)}</td>
                    <td className="num px-3 text-right">{meetingCounts.get(e.id) ?? 0}</td>
                    <td className="pr-5 pl-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => requestAction(e, 'remove')}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {inactive.length > 0 && (
        <Section title="Rejected and removed" description="Not part of the network. Restore anyone added by mistake." flush>
          <ul className="divide-y divide-line-soft">
            {inactive.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <Dot color={sectorColor(e.sector ?? '')} />
                <span className="min-w-0 flex-1 truncate text-sm">{e.fullName ?? e.name}</span>
                <span className="text-xs text-ink-muted">{label(e.approval)}</span>
                <Button size="sm" onClick={() => requestAction(e, 'restore')}>Restore</Button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <OrgDrawer entity={open} onClose={() => setOpen(null)} />
    </div>
  );
}

import type { ReactNode } from 'react';
import { Drawer } from '../../components/layout';
import { Badge } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { label } from '../../lib/sectors';
import type { Entity } from '../../lib/types';

export default function OrgDrawer({ entity, onClose, footer }: { entity: Entity | null; onClose: () => void; footer?: ReactNode }) {
  const rows: [string, ReactNode][] = entity
    ? [
        ['Member ID', <span className="num">{entity.id}</span>],
        ['Sector', label(entity.sector)],
        ['Type', label(entity.type)],
        ['Funding role', label(entity.fundingType)],
        ['Size', label(entity.size)],
        ['Region', label(entity.region)],
        ['Based in', entity.location],
        ['Applied', entity.appliedDate && formatDate(entity.appliedDate)],
      ]
    : [];
  return (
    <Drawer open={entity !== null} onClose={onClose} title={entity?.fullName ?? entity?.name} subtitle={entity?.name} footer={footer}>
      {entity && (
        <div className="divide-y divide-line">
          <div className="flex flex-wrap gap-1.5 px-5 py-4">
            <Badge>{label(entity.sector)}</Badge>
            <Badge tone="accent">{label(entity.approval)}</Badge>
          </div>
          {entity.description && (
            <div className="px-5 py-4">
              <h3 className="text-xs font-medium text-ink-muted">About</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{entity.description}</p>
            </div>
          )}
          {entity.duty && (
            <div className="px-5 py-4">
              <h3 className="text-xs font-medium text-ink-muted">Role in the network</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{entity.duty}</p>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm">
            {rows
              .filter(([, v]) => v && v !== 'Unknown')
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-ink-muted">{k}</dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
          </dl>
          {(entity.focusAreas?.length ?? 0) > 0 && (
            <div className="px-5 py-4">
              <h3 className="text-xs font-medium text-ink-muted">Focus areas</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {entity.focusAreas!.map((f) => (
                  <li key={f} className="rounded-md border border-line px-2 py-0.5 text-xs text-ink-soft">{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

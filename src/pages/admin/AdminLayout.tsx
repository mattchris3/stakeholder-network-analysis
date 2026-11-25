import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router';
import { useShell, type ShellContext } from '../../components/AppShell';
import { ConfirmDialog, PageHeader, StatCard, SubNav } from '../../components/layout';
import { useToast } from '../../components/Toast';
import { useTour } from '../../components/Tour';
import { ADMIN_TOUR } from '../../lib/tours';
import type { Entity } from '../../lib/types';

export type MemberAction = 'approve' | 'reject' | 'remove' | 'restore';

export interface AdminContext extends ShellContext {
  pending: Entity[];
  active: Entity[];
  inactive: Entity[];
  requestAction: (entity: Entity, action: MemberAction) => void;
}

export function useAdmin() {
  return useOutletContext<AdminContext>();
}

const today = () => new Date().toISOString().slice(0, 10);

const ACTIONS: Record<MemberAction, {
  title: (e: Entity) => string;
  body: ReactNode;
  confirm: string;
  tone: 'primary' | 'danger';
  patch: () => Partial<Entity>;
  done: (e: Entity) => string;
}> = {
  approve: {
    title: (e) => `Approve ${e.name}?`,
    body: 'They join the network straight away and can log and verify meetings.',
    confirm: 'Approve',
    tone: 'primary',
    patch: () => ({ approval: 'approved', status: 'active', approvedDate: today() }),
    done: (e) => `${e.name} is now a member`,
  },
  reject: {
    title: (e) => `Reject ${e.name}'s application?`,
    body: 'They stay out of the network. You can restore them later.',
    confirm: 'Reject',
    tone: 'danger',
    patch: () => ({ approval: 'rejected', rejectedDate: today() }),
    done: (e) => `${e.name}'s application was rejected`,
  },
  remove: {
    title: (e) => `Remove ${e.name} from the network?`,
    body: "They leave the graph and analytics. Their meetings stay on record, and you can restore them later.",
    confirm: 'Remove',
    tone: 'danger',
    patch: () => ({ approval: 'removed', removedDate: today() }),
    done: (e) => `${e.name} was removed`,
  },
  restore: {
    title: (e) => `Restore ${e.name}?`,
    body: 'They rejoin the network as an active member.',
    confirm: 'Restore',
    tone: 'primary',
    patch: () => ({ approval: 'approved', status: 'active', approvedDate: today() }),
    done: (e) => `${e.name} was restored`,
  },
};

export default function AdminLayout() {
  const shell = useShell();
  const toast = useToast();
  const [pendingAction, setPendingAction] = useState<{ entity: Entity; action: MemberAction } | null>(null);
  const [busy, setBusy] = useState(false);
  const tour = useTour();
  const location = useLocation();
  const tourRequest = (location.state as { tour?: number } | null)?.tour;

  useEffect(() => {
    if (shell.session.role !== 'admin') return;
    const t = setTimeout(() => (tourRequest ? tour.start('admin', ADMIN_TOUR) : tour.startOnce('admin', ADMIN_TOUR)), 600);
    return () => clearTimeout(t);
  }, [tourRequest]);

  const groups = useMemo(() => {
    const es = shell.data.entities;
    return {
      pending: es.filter((e) => e.approval === 'pending'),
      active: es.filter((e) => e.approval === 'approved' && e.status === 'active'),
      inactive: es.filter((e) => e.approval === 'rejected' || e.approval === 'removed'),
    };
  }, [shell.data.entities]);

  if (shell.session.role !== 'admin') return <Navigate to="/app/network" replace />;

  const meetings = shell.data.meetings;
  const confirmed = meetings.filter((m) => m.status === 'confirmed').length;
  const a = pendingAction ? ACTIONS[pendingAction.action] : ACTIONS.approve;

  async function confirm() {
    if (!pendingAction) return;
    setBusy(true);
    try {
      await shell.updateEntity(pendingAction.entity.id, ACTIONS[pendingAction.action].patch());
      toast(ACTIONS[pendingAction.action].done(pendingAction.entity));
      setPendingAction(null);
    } catch {
      toast("Couldn't save that. Try again.", 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <PageHeader
        title="Admin"
        description={
          shell.session.demo
            ? "Demo mode: approve, remove and edit freely. Changes stay in this tab and aren't saved."
            : `Manage ${shell.data.unity?.name ?? 'your network'}.`
        }
      />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="admin-stats">
        <StatCard label="Active members" value={groups.active.length} />
        <StatCard label="Applications waiting" value={groups.pending.length} />
        <StatCard label="Verified meetings" value={confirmed} />
        <StatCard label="Awaiting verification" value={meetings.length - confirmed} />
      </dl>
      <div data-tour="admin-tabs">
      <SubNav
        items={[
          { to: '/app/admin', label: 'Applications', badge: groups.pending.length },
          { to: '/app/admin/members', label: 'Members' },
          { to: '/app/admin/settings', label: 'Network settings' },
        ]}
      />
      </div>
      <Outlet
        context={{ ...shell, ...groups, requestAction: (entity, action) => setPendingAction({ entity, action }) } satisfies AdminContext}
      />
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction ? a.title(pendingAction.entity) : ''}
        body={a.body}
        confirmLabel={a.confirm}
        tone={a.tone}
        busy={busy}
        onConfirm={confirm}
        onCancel={() => !busy && setPendingAction(null)}
      />
    </div>
  );
}

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink } from 'react-router';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Underlined sub-navigation for a section's pages. */
export function SubNav({ items }: { items: { to: string; label: string; badge?: number }[] }) {
  return (
    <nav className="-mb-px flex gap-5 overflow-x-auto border-b border-line" aria-label="Section">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            `relative inline-flex h-10 shrink-0 items-center gap-1.5 text-sm font-medium transition-colors ${
              isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {item.label}
              {item.badge ? (
                <span className="num rounded-full bg-accent px-1.5 text-[11px] leading-[18px] text-white">{item.badge}</span>
              ) : null}
              {isActive && (
                <motion.span layoutId="subnav-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className = '',
  flush = false,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-ink-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? '' : 'p-4 sm:p-5'}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card px-4 py-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="num mt-1 text-2xl font-medium tracking-tight">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-ink-muted">{hint}</dd>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** A panel that slides in from the right, for details that need more room. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-ink/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-surface shadow-2xl shadow-black/10"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base leading-snug font-semibold">{title}</h2>
                {subtitle && <div className="mt-1 text-sm text-ink-muted">{subtitle}</div>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-sunken hover:text-ink"
              >
                <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Horizontal bars for a short categorical breakdown. */
export function BarList({
  items,
  color = '#4F46E5',
  format = (n: number) => String(n),
}: {
  items: { key: string; label: ReactNode; value: number; color?: string }[];
  color?: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="num text-ink-soft">{format(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line-soft">
            <motion.div
              className="h-full rounded-full"
              style={{ background: item.color ?? color }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A small centred dialog for confirming a consequential action. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-sm rounded-xl bg-surface p-5 shadow-2xl shadow-black/15"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <h2 id="confirm-title" className="font-semibold">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onCancel} className="h-9 rounded-lg px-3 text-sm font-medium text-ink-soft hover:bg-sunken hover:text-ink">
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                disabled={busy}
                onClick={onConfirm}
                className={`h-9 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                  tone === 'danger' ? 'bg-danger hover:bg-red-800' : 'bg-accent hover:bg-accent-strong'
                }`}
              >
                {busy ? 'Saving…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

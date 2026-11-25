// A guided tour: dims the page, cuts a spotlight around one element at a time
// and shows a small card beside it. Steps point at elements by their
// data-tour="…" attribute, so pages only need to label what they want explained.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface TourStep {
  /** The data-tour value of the element to highlight. Omit for a centred card. */
  target?: string;
  title: string;
  body: ReactNode;
}

interface TourContext {
  start: (id: string, steps: TourStep[]) => void;
  /** Starts the tour only if this browser hasn't finished or skipped it before. */
  startOnce: (id: string, steps: TourStep[]) => void;
  active: boolean;
}

const Ctx = createContext<TourContext>({ start: () => {}, startOnce: () => {}, active: false });
export const useTour = () => useContext(Ctx);

const seenKey = (id: string) => `unity.tour.${id}`;
function hasSeen(id: string) {
  try {
    return localStorage.getItem(seenKey(id)) === 'done';
  } catch {
    return false;
  }
}
function markSeen(id: string) {
  try {
    localStorage.setItem(seenKey(id), 'done');
  } catch {
    /* private mode: the tour may show again next time */
  }
}

const findTarget = (name?: string) =>
  name ? (document.querySelector<HTMLElement>(`[data-tour="${name}"]`) ?? null) : null;

/** Skips steps whose element isn't on screen (e.g. hidden on phones). */
const visible = (el: HTMLElement | null) => !!el && el.getClientRects().length > 0;

export function TourProvider({ children }: { children: ReactNode }) {
  const [tour, setTour] = useState<{ id: string; steps: TourStep[] } | null>(null);

  const start = useCallback((id: string, steps: TourStep[]) => {
    const usable = steps.filter((s) => !s.target || visible(findTarget(s.target)));
    if (usable.length) setTour({ id, steps: usable });
  }, []);

  const startOnce = useCallback(
    (id: string, steps: TourStep[]) => {
      if (!hasSeen(id)) start(id, steps);
    },
    [start],
  );

  const close = useCallback(() => {
    setTour((t) => {
      if (t) markSeen(t.id);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ start, startOnce, active: tour !== null }), [start, startOnce, tour]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <AnimatePresence>{tour && <TourOverlay key={tour.id} steps={tour.steps} onClose={close} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 8; // space between the element and the spotlight's edge
const GAP = 14; // space between the spotlight and the card
const CARD_W = 340;

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
}

function TourOverlay({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(180);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const vp = useViewport();
  const step = steps[index];
  const last = index === steps.length - 1;

  // Bring the target into view, then follow it while the page scrolls or resizes.
  useLayoutEffect(() => {
    const el = findTarget(step.target);
    if (!el) {
      setBox(null);
      return;
    }
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setBox({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 });
      });
    };
    measure();
    const settle = window.setTimeout(measure, 450); // after smooth scrolling ends
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [step.target, reduced]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, box, vp.w]);

  // Keyboard: arrows move, Escape skips. Focus the card so screen readers announce it.
  useEffect(() => {
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') (last ? onClose() : setIndex((i) => i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, last, onClose]);

  // Place the card below the spotlight, else above, else beside it; always on screen.
  const cardW = Math.min(CARD_W, vp.w - 24);
  let left = (vp.w - cardW) / 2;
  let top = (vp.h - cardH) / 2;
  if (box) {
    const below = box.y + box.h + GAP;
    const above = box.y - GAP - cardH;
    if (below + cardH <= vp.h - 12) top = below;
    else if (above >= 12) top = above;
    else if (box.x + box.w + GAP + cardW <= vp.w - 12) {
      left = box.x + box.w + GAP;
      top = box.y;
    } else if (box.x - GAP - cardW >= 12) {
      left = box.x - GAP - cardW;
      top = box.y;
    } else top = vp.h - cardH - 12;
    if (top === below || top === above || top === vp.h - cardH - 12) left = box.x + box.w / 2 - cardW / 2;
    left = Math.max(12, Math.min(vp.w - cardW - 12, left));
    top = Math.max(12, Math.min(vp.h - cardH - 12, top));
  }

  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 36 };
  const hole = box ?? { x: vp.w / 2, y: vp.h / 2, w: 0, h: 0 };

  return (
    <motion.div
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
    >
      {/* Dimmed page with a rounded cut-out around the current element. */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect rx={12} fill="black" initial={false} animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }} transition={spring} />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgb(24 24 27 / 0.55)" mask="url(#tour-mask)" />
        {box && (
          <motion.rect
            rx={12}
            fill="none"
            stroke="#818CF8"
            strokeWidth={2}
            initial={false}
            animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }}
            transition={spring}
          />
        )}
      </svg>
      {/* Clicks on the dimmed area do nothing, so the tour isn't lost by accident. */}
      <div className="absolute inset-0" />

      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        className="absolute rounded-xl bg-surface p-5 shadow-2xl shadow-black/20 outline-none"
        style={{ width: cardW }}
        initial={false}
        animate={{ left, top }}
        transition={spring}
      >
        <div className="flex items-center justify-between">
          <span className="num text-xs text-ink-muted">
            {index + 1} of {steps.length}
          </span>
          <button type="button" onClick={onClose} className="text-xs text-ink-muted hover:text-ink">
            Skip tour
          </button>
        </div>
        {/* Keyed fade-in only: an exit animation here can get stuck on fast clicks. */}
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
        >
          <h2 id="tour-title" className="mt-2 font-semibold">{step.title}</h2>
          <div id="tour-body" className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.body}</div>
        </motion.div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-accent' : 'w-1.5 bg-line'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="h-8 rounded-lg px-3 text-[13px] font-medium text-ink-soft hover:bg-sunken hover:text-ink"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? onClose() : setIndex((i) => i + 1))}
              className="h-8 rounded-lg bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-strong"
            >
              {last ? 'Done' : index === 0 ? 'Show me' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

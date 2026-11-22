import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type Tone = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; tone: Tone }

const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const show = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++next.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm shadow-lg shadow-black/10 ${
                t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-white'
              }`}
              role={t.tone === 'error' ? 'alert' : 'status'}
            >
              {t.tone === 'success' && <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

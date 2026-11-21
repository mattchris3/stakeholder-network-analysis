import { motion } from 'motion/react';
import { Link } from 'react-router';
import HeroGraph from '../components/HeroGraph';
import { Button, ButtonLink, Logo } from '../components/ui';
import { useStartDemo } from '../lib/useDemo';

const REPO = 'https://github.com/mattchris3/stakeholder-network-analysis';

const STEPS = [
  {
    n: '01',
    title: 'Log a meeting',
    body: 'Any member records a meeting it took part in: who attended, the purpose and the outcome.',
  },
  {
    n: '02',
    title: 'Everyone verifies',
    body: 'Each participant confirms or disputes it on their own. A meeting counts only once all of them approve.',
  },
  {
    n: '03',
    title: 'The map updates',
    body: 'Verified meetings become links. Strength, clusters and gaps are recalculated from the record.',
  },
];

const FEATURES = [
  {
    title: 'A graph you can question',
    body: 'Core-periphery or cluster layouts, filters by sector, strength and period, and a search that finds every link between two organisations.',
  },
  {
    title: 'Insights from the record',
    body: 'Unique-contribution scores, bridge organisations that join separate domains, and the partnerships that are missing.',
  },
  {
    title: 'One platform, many networks',
    body: 'Each network is isolated by its own ID and defines its own focus areas, so health, energy or finance partnerships all fit.',
  },
];

const rise = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Landing() {
  const startDemo = useStartDemo();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Unity home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <a href="#how" className="hidden h-8 items-center rounded-lg px-3 text-[13px] text-ink-soft hover:text-ink sm:inline-flex">
            How it works
          </a>
          <a href={REPO} className="hidden h-8 items-center rounded-lg px-3 text-[13px] text-ink-soft hover:text-ink sm:inline-flex">
            GitHub
          </a>
          <ButtonLink to="/sign-in" size="sm" variant="ghost">
            Sign in
          </ButtonLink>
          <Button size="sm" variant="primary" onClick={startDemo}>
            Try the demo
          </Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-20 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-20">
          <div>
            <motion.p {...rise} transition={{ duration: 0.5 }} className="eyebrow">
              Stakeholder network analysis
            </motion.p>
            <motion.h1
              {...rise}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-4 text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl"
            >
              See who really works with whom.
            </motion.h1>
            <motion.p
              {...rise}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-ink-soft"
            >
              Unity turns the meetings partner organisations log and verify together into a live map of the
              network: who collaborates, how strongly, and where the gaps are.
            </motion.p>
            <motion.div {...rise} transition={{ duration: 0.6, delay: 0.2 }} className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={startDemo}>
                Try the demo
                <span aria-hidden="true">→</span>
              </Button>
              <ButtonLink to="/sign-in" size="lg">
                Sign in to a network
              </ButtonLink>
            </motion.div>
            <motion.p {...rise} transition={{ duration: 0.6, delay: 0.26 }} className="mt-4 text-sm text-ink-muted">
              No sign-up. Opens a sample global-health network of 15 organisations.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="card relative overflow-hidden p-4 sm:p-6"
          >
            <HeroGraph />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md bg-canvas/90 px-2.5 py-1.5 text-xs text-ink-soft sm:bottom-6 sm:left-6">
              <span className="size-2 rounded-full bg-accent" />
              WHO's verified partnerships
            </div>
          </motion.div>
        </section>

        <section id="how" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-balance">
              A shared logbook instead of a survey, so no one can inflate their own position.
            </h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t border-line pt-5">
                  <span className="num text-sm text-accent">{s.n}</span>
                  <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-xl bg-ink px-6 py-8 text-white sm:flex-row sm:items-center sm:px-8">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Explore the sample network</h2>
              <p className="mt-1 text-white/70">You'll sign in as WHO. Nothing you do there is saved.</p>
            </div>
            <Button variant="primary" size="lg" onClick={startDemo}>
              Try the demo
              <span aria-hidden="true">→</span>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:justify-between sm:px-6">
          <p>Final-year Computer Science project, Queen's University Belfast.</p>
          <p>
            Built by Matthew Christensen ·{' '}
            <a href={REPO} className="underline decoration-line underline-offset-4 hover:text-ink">
              Source on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

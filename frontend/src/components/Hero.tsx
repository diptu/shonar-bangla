import { Icon } from './Icon'

export function Hero() {
  return (
    <section className="relative flex h-[80vh] min-h-[640px] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 242, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow rounded-full bg-primary-container/10 blur-3xl" />
        <div className="absolute inset-0 [background:radial-gradient(circle_at_center,transparent_0%,#10141a_85%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-margin-mobile text-center">
        <div className="glass-panel mb-6 inline-flex items-center gap-2 rounded-full border-primary-container/30 px-4 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
            Live Network Pulse: Dhaka Central
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl mb-6 tracking-tight leading-tight">
          Resurgence of <br />
          <span className="text-gradient-teal">Digital Heritage</span>
        </h1>
        <p className="font-body-lg text-body-lg mx-auto mb-10 max-w-2xl text-on-surface-variant opacity-80">
          Synthesizing real-time regional intelligence with historical continuity. Experience the
          next generation of data-driven connectivity across the Shonar Bangla ecosystem.
        </p>
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <button
            type="button"
            className="neon-glow-primary group flex items-center gap-3 rounded-lg bg-primary-container px-10 py-5 font-headline-md text-headline-md font-bold text-on-primary-container transition-all active:scale-95"
          >
            EXPLORE DATA
            <Icon
              name="trending_flat"
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
          <button
            type="button"
            className="glass-panel rounded-lg border border-primary/20 px-10 py-5 font-headline-md text-headline-md font-medium text-primary transition-all hover:bg-surface-variant/40"
          >
            HERITAGE ARCHIVE
          </button>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-40">
        <span className="font-label-sm text-label-sm uppercase tracking-widest">
          Scroll to Analyze
        </span>
        <div className="h-12 w-px bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  )
}

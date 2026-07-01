import { Icon } from './Icon'

const GROWTH_BARS = [
  { label: 'JAN', height: 40, tone: 'bg-primary/10' },
  { label: 'FEB', height: 60, tone: 'bg-primary/15' },
  { label: 'MAR', height: 55, tone: 'bg-primary/10' },
  { label: 'APR', height: 85, tone: 'bg-primary/20' },
  { label: 'MAY', height: 70, tone: 'bg-primary/40' },
  { label: 'JUN', height: 95, tone: 'bg-primary-container' },
  { label: 'JUL', height: 65, tone: 'bg-primary/30' },
]

export function MetricsSection() {
  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-24 md:px-margin-desktop">
      <div className="mb-16 flex items-end justify-between">
        <div>
          <p className="font-label-sm text-label-sm mb-2 uppercase tracking-[0.2em] text-primary">
            Real-time Metrics
          </p>
          <h2 className="font-headline-lg text-headline-lg font-bold">Connectivity Intelligence</h2>
        </div>
        <button
          type="button"
          className="font-label-sm text-label-sm hidden items-center gap-2 border-b border-outline-variant/30 pb-1 text-on-surface-variant transition-all hover:text-primary sm:flex"
        >
          VIEW ALL PARAMETERS <Icon name="open_in_new" className="text-[16px]" />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Growth Vectors chart */}
        <div className="glass-panel relative col-span-12 overflow-hidden rounded-xl p-8 transition-all duration-500 hover:border-primary-container/30 lg:col-span-8">
          <div className="flex h-full flex-col">
            <div className="mb-8 flex justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md mb-1 text-primary">
                  Growth Vectors
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Regional infrastructure expansion metrics
                </p>
              </div>
              <div className="text-right">
                <span className="font-data-display text-data-display text-primary">+24.8%</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  YOY PERFORMANCE
                </p>
              </div>
            </div>
            <div className="flex min-h-[300px] flex-1 items-end gap-2">
              {GROWTH_BARS.map((bar) => (
                <div
                  key={bar.label}
                  className={`group/bar relative flex-1 cursor-pointer rounded-t transition-all hover:bg-primary/30 ${bar.tone}`}
                  style={{ height: `${bar.height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-primary opacity-0 transition-opacity font-label-sm group-hover/bar:opacity-100">
                    {bar.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured highlight card */}
        <div className="group relative col-span-12 overflow-hidden rounded-xl lg:col-span-4">
          <div className="h-full w-full bg-[linear-gradient(160deg,#004f54_0%,#10141a_65%)] transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <span className="font-label-sm mb-4 inline-block rounded-full bg-primary-container/20 px-3 py-1 text-[10px] text-primary">
              CITY OVERVIEW
            </span>
            <h4 className="font-headline-md text-headline-md mb-2 font-bold text-white">
              Purbachal Smart Grid
            </h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              System Status: Active
            </p>
          </div>
        </div>

        {/* Metric tile: Total Nodes */}
        <div className="glass-panel col-span-12 rounded-xl border-l-4 border-primary-container p-8 md:col-span-4 lg:col-span-3">
          <Icon name="hub" className="mb-6 text-[32px] text-primary" />
          <h5 className="font-label-sm text-label-sm mb-2 uppercase tracking-widest text-on-surface-variant">
            Total Nodes
          </h5>
          <p className="font-data-display text-headline-lg font-bold text-primary">12,482</p>
          <div className="mt-4 flex items-center gap-2 text-[12px] text-on-secondary-container">
            <Icon name="arrow_upward" className="text-[14px]" />
            112 NEW NODES TODAY
          </div>
        </div>

        {/* Metric tile: Heritage Score */}
        <div className="glass-panel col-span-12 rounded-xl border-l-4 border-secondary-container p-8 md:col-span-4 lg:col-span-3">
          <Icon name="history_edu" className="mb-6 text-[32px] text-secondary-container" />
          <h5 className="font-label-sm text-label-sm mb-2 uppercase tracking-widest text-on-surface-variant">
            Heritage Score
          </h5>
          <p className="font-data-display text-headline-lg font-bold text-secondary-container">
            0.94
          </p>
          <div className="mt-4 flex items-center gap-2 text-[12px] text-on-surface-variant">
            <Icon name="verified" className="text-[14px]" />
            CULTURAL FIDELITY HIGH
          </div>
        </div>

        {/* Map integration teaser */}
        <div className="glass-panel relative col-span-12 h-[240px] overflow-hidden rounded-xl p-2 md:col-span-4 lg:col-span-6">
          <div className="h-full w-full rounded-lg bg-[linear-gradient(135deg,#181c22_0%,#0a0e14_100%)] opacity-70 transition-all duration-700 hover:opacity-100" />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              className="font-label-sm text-label-sm rounded-full border border-primary/20 bg-background/80 px-6 py-3 text-primary backdrop-blur-md transition-all hover:bg-primary hover:text-on-primary"
            >
              OPEN INTERACTIVE ATLAS
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

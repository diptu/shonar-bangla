import { Icon } from './Icon'

const NAV_ITEMS = [
  { icon: 'map', label: 'Map View', active: true },
  { icon: 'location_on', label: 'Location Filters', active: false },
  { icon: 'category', label: 'Category Filters', active: false },
  { icon: 'filter_list', label: 'Sub-Category', active: false },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col overflow-hidden border-r border-outline-variant/10 bg-surface-container/80 pb-8 pt-24 shadow-2xl backdrop-blur-2xl md:w-72">
      <div className="mb-8 hidden px-6 md:block">
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
          Intelligence Hub
        </p>
        <h3 className="font-headline-md text-headline-md font-bold text-primary">
          Regional Hub
        </h3>
      </div>
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href="#"
            className={
              item.active
                ? 'flex items-center gap-3 border-l-4 border-primary-container bg-primary-container/20 px-6 py-4 text-primary-fixed transition-all duration-200 active:scale-95'
                : 'flex items-center gap-3 px-6 py-4 text-on-surface-variant transition-all duration-200 hover:bg-surface-variant/20 hover:text-primary-fixed active:scale-95'
            }
          >
            <Icon name={item.icon} filled={item.active} />
            <span className="font-label-sm text-label-sm hidden uppercase tracking-widest md:block">
              {item.label}
            </span>
          </a>
        ))}
      </nav>
      <div className="mt-auto space-y-4 px-6">
        <button
          type="button"
          className="hidden w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-3 font-label-sm text-label-sm font-bold uppercase tracking-tighter text-on-primary-container shadow-lg transition-all hover:bg-primary-fixed-dim md:flex"
        >
          <Icon name="file_download" className="text-[18px]" />
          Export Data
        </button>
        <div className="space-y-1 border-t border-outline-variant/10 pt-6">
          <a
            href="#"
            className="flex items-center gap-3 px-2 py-2 text-on-surface-variant transition-colors hover:text-primary-fixed"
          >
            <Icon name="help" />
            <span className="font-label-sm text-label-sm hidden uppercase tracking-widest md:block">
              Support
            </span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-2 py-2 text-on-surface-variant transition-colors hover:text-primary-fixed"
          >
            <Icon name="terminal" />
            <span className="font-label-sm text-label-sm hidden uppercase tracking-widest md:block">
              Logs
            </span>
          </a>
        </div>
      </div>
    </aside>
  )
}

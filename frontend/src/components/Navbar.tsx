import { Icon } from './Icon'

const NAV_LINKS = ['Dashboard', 'Analytics', 'Connectivity', 'Heritage']

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-outline-variant/20 bg-background/60 px-margin-mobile py-4 shadow-[0_0_20px_rgba(0,242,255,0.15)] backdrop-blur-xl md:px-margin-desktop">
      <div className="flex items-center gap-8">
        <span className="font-headline-md text-headline-md font-bold tracking-tighter text-primary-container">
          SHONAR BANGLA
        </span>
        <div className="hidden gap-6 md:flex">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link}
              href="#"
              className={
                i === 0
                  ? 'font-body-md text-body-md border-b-2 border-primary-container pb-1 text-primary transition-all'
                  : 'font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary'
              }
            >
              {link}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-high px-4 py-2 lg:flex">
          <Icon name="search" className="text-[20px] text-on-surface-variant" />
          <input
            type="text"
            placeholder="Intelligence Search..."
            className="font-label-sm text-label-sm w-48 border-none bg-transparent text-on-surface focus:ring-0 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="text-on-surface-variant transition-colors hover:text-primary-container"
          >
            <Icon name="notifications" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="text-on-surface-variant transition-colors hover:text-primary-container"
          >
            <Icon name="settings" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container/30 bg-surface-container-high text-on-surface-variant">
            <Icon name="person" />
          </div>
        </div>
      </div>
    </nav>
  )
}

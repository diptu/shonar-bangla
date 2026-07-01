import { Icon } from './Icon'

const FOOTER_LINKS = ['Privacy Protocol', 'System Status', 'Security Alpha']

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/5 bg-surface-container-lowest py-12">
      <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        <div className="mb-12 flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="text-center md:text-left">
            <span className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">
              SHONAR BANGLA
            </span>
            <p className="font-label-sm text-label-sm mt-2 max-w-xs text-on-surface-variant">
              Building the future of regional intelligence with integrity and cultural pride.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="font-label-sm text-label-sm text-on-tertiary-fixed-variant transition-colors hover:text-primary-fixed-dim"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-8 opacity-80 md:flex-row">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 SHONAR BANGLA INTEL. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              aria-label="Share"
              className="glass-panel flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:text-primary"
            >
              <Icon name="share" className="text-[18px]" />
            </button>
            <button
              type="button"
              aria-label="Public site"
              className="glass-panel flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:text-primary"
            >
              <Icon name="public" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

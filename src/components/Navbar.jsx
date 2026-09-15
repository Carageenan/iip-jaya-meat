import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { buildWhatsappUrl, siteConfig } from '../lib/siteConfig'

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/tentang', label: 'Tentang' },
  { to: '/produk', label: 'Produk' },
  { to: '/kontak', label: 'Kontak' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const navLinkClass = ({ isActive }) =>
    `relative py-1 text-sm font-medium transition-colors hover:text-brand ${
      isActive ? 'text-brand after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-brand' : 'text-ink'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img
            src="/logo.png"
            alt={siteConfig.name}
            className="h-9 w-9 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span className="font-heading text-lg font-bold text-brand">{siteConfig.name}</span>
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Hubungi via WhatsApp
          </a>
        </nav>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink md:hidden"
          aria-label="Buka menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-ink/10 bg-cream px-4 pb-4 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-md px-2 py-2 text-sm font-medium ${isActive ? 'bg-brand/10 text-brand' : 'text-ink'}`
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-2 rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white"
          >
            Hubungi via WhatsApp
          </a>
        </nav>
      )}
    </header>
  )
}

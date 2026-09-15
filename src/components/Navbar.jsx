import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { buildWhatsappUrl, siteConfig } from '../lib/siteConfig'
import { useSettings } from '../hooks/useSettings'
import { useCart } from '../hooks/useCart'
import { assetUrl } from '../lib/assetUrl'

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/tentang', label: 'Tentang' },
  { to: '/produk', label: 'Produk' },
  { to: '/kontak', label: 'Kontak' },
]

function CartIcon({ count }) {
  return (
    <NavLink to="/keranjang" className="relative flex h-9 w-9 items-center justify-center text-ink hover:text-brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13L5.4 5M7 13l-1.5 3H17M9 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </NavLink>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { onlineOrderingEnabled } = useSettings()
  const { totalItems } = useCart()

  const navLinkClass = ({ isActive }) =>
    `relative py-1 text-sm font-medium transition-colors hover:text-brand ${
      isActive ? 'text-brand after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-brand' : 'text-ink'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img
            src={assetUrl('/logo.png')}
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
          {onlineOrderingEnabled && <CartIcon count={totalItems} />}
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Hubungi via WhatsApp
          </a>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          {onlineOrderingEnabled && <CartIcon count={totalItems} />}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink"
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

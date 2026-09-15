import { siteConfig } from '../lib/siteConfig'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-ink/10 bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <h3 className="font-heading text-xl font-bold text-white">{siteConfig.name}</h3>
          <p className="mt-2 text-sm text-cream/70">{siteConfig.tagline}</p>
        </div>

        <div className="text-sm text-cream/80">
          <p className="font-semibold text-white">Kontak</p>
          <p className="mt-2">{siteConfig.address}</p>
          <p className="mt-1">{siteConfig.operatingHours}</p>
          <p className="mt-1">
            <a href={`https://wa.me/${siteConfig.whatsappNumber}`} className="hover:text-white" target="_blank" rel="noreferrer">
              WA: +{siteConfig.whatsappNumber}
            </a>
          </p>
          <p className="mt-1">
            <a href={`mailto:${siteConfig.email}`} className="hover:text-white">
              {siteConfig.email}
            </a>
          </p>
        </div>

        <div className="text-sm text-cream/80">
          <p className="font-semibold text-white">Ikuti Kami</p>
          <p className="mt-2 text-cream/60">Instagram &amp; Facebook menyusul</p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/60">
        &copy; {year} {siteConfig.name}. Hak cipta dilindungi.
      </div>
    </footer>
  )
}

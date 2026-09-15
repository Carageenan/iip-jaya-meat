import { usePageTitle } from '../hooks/usePageTitle'
import { siteConfig, buildWhatsappUrl } from '../lib/siteConfig'

export default function Kontak() {
  usePageTitle('Kontak')

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Hubungi Kami</h1>
      <p className="mt-2 text-ink/60">Ada pertanyaan atau ingin pesan? Hubungi kami langsung.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-ink/10 bg-white p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Alamat</p>
            <p className="mt-1 text-ink/80">{siteConfig.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Jam Operasional</p>
            <p className="mt-1 text-ink/80">{siteConfig.operatingHours}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">WhatsApp</p>
            <a href={buildWhatsappUrl()} target="_blank" rel="noreferrer" className="mt-1 block text-brand hover:underline">
              +{siteConfig.whatsappNumber}
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Email</p>
            <a href={`mailto:${siteConfig.email}`} className="mt-1 block text-brand hover:underline">
              {siteConfig.email}
            </a>
          </div>

          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block rounded-full bg-brand px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Chat WhatsApp Sekarang
          </a>
        </div>

        <div className="overflow-hidden rounded-xl border border-ink/10">
          <iframe
            title="Lokasi IIP JAYA MEAT"
            src={siteConfig.mapsEmbedUrl}
            className="h-full min-h-72 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  )
}

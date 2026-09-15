import { usePageTitle } from '../hooks/usePageTitle'
import { siteConfig } from '../lib/siteConfig'
import { assetUrl } from '../lib/assetUrl'

export default function Tentang() {
  usePageTitle('Tentang Kami')

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Tentang {siteConfig.name}</h1>

      <div className="mt-8 overflow-hidden rounded-xl bg-ink/5">
        <img
          src={assetUrl('/images/tentang.jpg')}
          alt={siteConfig.name}
          className="h-64 w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <div className="mt-8 space-y-4 text-ink/80 leading-relaxed">
        <p>{siteConfig.description}</p>
        <p>
          {/* GANTI: tulis sejarah dan cerita perusahaan yang sebenarnya di sini. */}
          Berdiri dengan komitmen menyediakan daging berkualitas, {siteConfig.name} terus menjaga kesegaran dan
          kebersihan produk mulai dari pemilihan pemasok hingga sampai ke tangan pelanggan.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-ink/10 bg-white p-6">
          <h2 className="font-heading text-xl font-bold text-brand">Visi</h2>
          <p className="mt-2 text-sm text-ink/70">
            {/* GANTI: isi visi perusahaan */}
            Menjadi penyedia daging segar terpercaya nomor satu di area layanan kami.
          </p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white p-6">
          <h2 className="font-heading text-xl font-bold text-brand">Misi</h2>
          <p className="mt-2 text-sm text-ink/70">
            {/* GANTI: isi misi perusahaan */}
            Menjaga kualitas, kebersihan, dan pelayanan terbaik bagi setiap pelanggan.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-ink/10 bg-white p-6">
        <h2 className="font-heading text-xl font-bold text-ink">Area Layanan</h2>
        <p className="mt-2 text-sm text-ink/70">{siteConfig.address}</p>
      </div>
    </div>
  )
}

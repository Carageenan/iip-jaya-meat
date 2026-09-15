import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { usePageTitle } from '../hooks/usePageTitle'
import { siteConfig, buildWhatsappUrl } from '../lib/siteConfig'
import ProductCard from '../components/ProductCard'

const features = [
  {
    title: 'Daging Segar Setiap Hari',
    desc: 'Dipotong dan dikirim setiap hari, langsung dari pemasok terpercaya.',
    icon: (
      <path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: 'Harga Bersaing',
    desc: 'Harga transparan dan bersaing untuk rumah tangga maupun usaha kuliner.',
    icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: 'Bisa Antar',
    desc: 'Layanan antar untuk area sekitar, tinggal hubungi via WhatsApp.',
    icon: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM6.5 20a2 2 0 100-4 2 2 0 000 4zM17.5 20a2 2 0 100-4 2 2 0 000 4z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: 'Halal',
    desc: 'Seluruh produk terjamin halal dan higienis.',
    icon: <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />,
  },
]

export default function Home() {
  usePageTitle('Beranda')
  const { products, loading } = useProducts()
  const featured = products.filter((p) => p.is_available).slice(0, 4)

  return (
    <div>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-ink text-white">
        <img
          src="/images/hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/60 to-ink/20" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">{siteConfig.name}</h1>
          <p className="mt-4 text-lg text-cream/90">{siteConfig.tagline}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/produk"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Lihat Produk
            </Link>
            <a
              href={buildWhatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Pesan via WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-ink/10 bg-white p-6 text-center shadow-sm">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mx-auto text-brand"
              >
                {f.icon}
              </svg>
              <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-3xl font-bold text-ink">Produk Unggulan</h2>
            <Link to="/produk" className="text-sm font-semibold text-brand hover:underline">
              Lihat Semua Produk
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-ink/5" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <p className="mt-8 text-ink/60">Belum ada produk untuk ditampilkan.</p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-brand py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-heading text-3xl font-bold">Butuh Daging Segar Hari Ini?</h2>
          <p className="mt-3 text-white/90">Hubungi kami langsung via WhatsApp, kami siap membantu.</p>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand hover:bg-cream"
          >
            Chat WhatsApp Sekarang
          </a>
        </div>
      </section>
    </div>
  )
}

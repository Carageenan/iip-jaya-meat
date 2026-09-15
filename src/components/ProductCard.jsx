import { formatRupiah, CATEGORIES } from '../lib/format'
import { buildWhatsappUrl } from '../lib/siteConfig'

export default function ProductCard({ product }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-4/3 w-full bg-ink/5">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink/40">
            Belum ada foto
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink">{product.name}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              product.is_available ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'
            }`}
          >
            {product.is_available ? 'Tersedia' : 'Habis'}
          </span>
        </div>

        <p className="mt-1 text-xs uppercase tracking-wide text-ink/40">{categoryLabel}</p>

        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink/60">{product.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-heading text-lg font-bold text-brand">
            {formatRupiah(product.price)}
            <span className="ml-1 text-xs font-normal text-ink/50">/{product.unit}</span>
          </span>
        </div>

        <a
          href={product.is_available ? buildWhatsappUrl(`Halo, saya mau pesan ${product.name}`) : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!product.is_available}
          className={`mt-4 rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors ${
            product.is_available
              ? 'bg-brand text-white hover:bg-brand-dark'
              : 'pointer-events-none bg-ink/10 text-ink/40'
          }`}
        >
          Pesan via WhatsApp
        </a>
      </div>
    </div>
  )
}

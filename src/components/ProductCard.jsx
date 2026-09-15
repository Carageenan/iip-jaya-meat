import { formatRupiah, CATEGORIES, getStockStatus } from '../lib/format'
import { buildWhatsappUrl } from '../lib/siteConfig'
import { useSettings } from '../hooks/useSettings'
import { useCart } from '../hooks/useCart'
import { useToast } from './Toast'

export default function ProductCard({ product }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category
  const status = getStockStatus(product)
  const { onlineOrderingEnabled } = useSettings()
  const { addItem } = useCart()
  const { showToast } = useToast()

  function handleAddToCart() {
    addItem(product, 1)
    showToast(`${product.name} ditambahkan ke keranjang.`)
  }

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
        <h3 className="font-semibold text-ink">{product.name}</h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-ink/40">{categoryLabel}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink/60">{product.description}</p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between">
            <span className="font-heading text-lg font-bold text-brand">
              {formatRupiah(product.price)}
              <span className="ml-1 text-xs font-normal text-ink/50">/{product.unit}</span>
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {onlineOrderingEnabled && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.is_available}
                className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors ${
                  product.is_available
                    ? 'bg-brand text-white hover:bg-brand-dark'
                    : 'pointer-events-none bg-ink/10 text-ink/40'
                }`}
              >
                Tambah ke Keranjang
              </button>
            )}

            <a
              href={product.is_available ? buildWhatsappUrl(`Halo, saya mau pesan ${product.name}`) : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!product.is_available}
              className={`block rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors ${
                !product.is_available
                  ? 'pointer-events-none bg-ink/10 text-ink/40'
                  : onlineOrderingEnabled
                    ? 'border border-brand text-brand hover:bg-brand/5'
                    : 'bg-brand text-white hover:bg-brand-dark'
              }`}
            >
              Pesan via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

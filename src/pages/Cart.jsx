import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatRupiah } from '../lib/format'

export default function Cart() {
  usePageTitle('Keranjang')
  const { items, updateQuantity, removeItem, totalPrice } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-bold text-ink">Keranjang Kosong</h1>
        <p className="mt-2 text-ink/60">Belum ada produk yang ditambahkan.</p>
        <Link
          to="/produk"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Lihat Produk
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Keranjang</h1>

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-ink/10 bg-white p-4"
          >
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-lg bg-ink/10" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{item.name}</p>
              <p className="text-sm text-ink/50">
                {formatRupiah(item.price)} /{item.unit}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"
                aria-label="Kurangi jumlah"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink/5"
                aria-label="Tambah jumlah"
              >
                +
              </button>
            </div>

            <p className="w-24 shrink-0 text-right text-sm font-semibold text-ink">
              {formatRupiah(item.price * item.quantity)}
            </p>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Hapus ${item.name}`}
              className="shrink-0 text-ink/30 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-4 border-t border-ink/10 pt-6">
        <div className="text-right">
          <p className="text-sm text-ink/50">Total</p>
          <p className="font-heading text-2xl font-bold text-brand">{formatRupiah(totalPrice)}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Lanjut ke Checkout
        </button>
      </div>
    </div>
  )
}

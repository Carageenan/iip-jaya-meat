import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../components/Toast'
import { formatRupiah, CATEGORIES, PAYMENT_TYPES } from '../../lib/format'
import * as ordersApi from '../../lib/ordersApi'
import * as productsApi from '../../lib/productsApi'

export default function Kasir() {
  usePageTitle('Kasir')
  const { cashierEnabled, loading: settingsLoading } = useSettings()
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts()
  const { showToast } = useToast()
  const { session, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [stockAdjustProduct, setStockAdjustProduct] = useState(null)

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('semua')
  const [cart, setCart] = useState([]) // { id, name, price, unit, quantity }

  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = category === 'semua' || p.category === category
      const matchSearch = p.name.toLowerCase().includes(search.trim().toLowerCase())
      return matchCategory && matchSearch && p.is_available
    })
  }, [products, category, search])

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart])

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, unit: product.unit, quantity: 1 }]
    })
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.id !== productId)
      return prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
    })
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.id !== productId))
  }

  function handleProofChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  function handleRemoveProof() {
    setProofFile(null)
    setProofPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetForm() {
    setCart([])
    setBuyerName('')
    setBuyerPhone('')
    setPaymentType('cash')
    setAmountPaid('')
    setProofFile(null)
    setProofPreview('')
    setErrors({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validate() {
    const errs = {}
    if (cart.length === 0) errs.cart = 'Belum ada produk ditambahkan.'
    if (!buyerName.trim()) errs.buyerName = 'Nama pembeli wajib diisi.'
    if (paymentType === 'dp') {
      const amt = Number(amountPaid)
      if (!amountPaid || amt <= 0) errs.amountPaid = 'Jumlah DP wajib diisi.'
      else if (amt >= total) errs.amountPaid = 'Jumlah DP harus kurang dari total (kalau lunas, pilih Cash).'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      let proofPath = null
      if (proofFile) {
        proofPath = await ordersApi.uploadProof(proofFile)
      }

      await ordersApi.createCashierOrder({
        customer: { name: buyerName.trim(), phone: buyerPhone.trim() },
        items: cart,
        total,
        paymentType,
        amountPaid: paymentType === 'dp' ? Number(amountPaid) : total,
        proofPath,
      })

      showToast('Transaksi berhasil dicatat.')
      resetForm()
    } catch (err) {
      showToast(err.message || 'Gagal mencatat transaksi.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!settingsLoading && !cashierEnabled) {
    return (
      <div className="min-h-screen bg-cream">
        <header className="border-b border-ink/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <h1 className="font-heading text-xl font-bold text-ink">Kasir</h1>
              {isAdmin && (
                <Link to="/admin/dashboard" className="text-xs text-brand hover:underline">
                  ← Kembali ke Kelola Produk
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/80"
            >
              Keluar
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
          <p className="text-ink/60">
            Fitur Kasir sedang dimatikan. Nyalakan dulu lewat toggle "Mode Kasir" di halaman Kelola Produk.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Kasir</h1>
            <p className="text-xs text-ink/50">{session?.user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
              >
                Kelola Produk
              </Link>
            )}
            <Link
              to="/admin/orders"
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Kelola Pesanan
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/80"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Kolom produk */}
          <div className="lg:col-span-3">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
              >
                <option value="semua">Semua Kategori</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-2">
              {productsLoading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-ink/5" />)
              ) : filteredProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink/50">Tidak ada produk tersedia.</p>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-ink/10 bg-white px-4 py-3 hover:border-brand"
                  >
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-ink/10" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink/50">{formatRupiah(p.price)} /{p.unit}</p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStockAdjustProduct(p)}
                        title="Ubah stok produk ini"
                        className="rounded-full border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60 hover:border-brand hover:text-brand"
                      >
                        Stok {p.stock}
                      </button>
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        aria-label={`Tambah ${p.name} ke transaksi`}
                        className="text-lg font-bold text-brand"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kolom keranjang & form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-ink/10 bg-white p-4">
              <h2 className="font-heading text-lg font-bold text-ink">Transaksi</h2>

              {cart.length === 0 ? (
                <p className="mt-4 text-sm text-ink/50">Klik produk di kiri untuk menambahkan.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-ink/80">{item.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-xs hover:bg-ink/5"
                        >
                          −
                        </button>
                        <span className="w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-xs hover:bg-ink/5"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-20 shrink-0 text-right font-medium text-ink">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="shrink-0 text-ink/30 hover:text-red-600"
                        aria-label={`Hapus ${item.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-ink/10 pt-2 text-sm font-semibold text-ink">
                    <span>Total</span>
                    <span className="text-brand">{formatRupiah(total)}</span>
                  </div>
                </div>
              )}
              {errors.cart && <p className="mt-2 text-xs text-red-600">{errors.cart}</p>}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-ink/10 pt-4">
                <div>
                  <label className="block text-sm font-medium text-ink/70">Nama Pembeli</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                  {errors.buyerName && <p className="mt-1 text-xs text-red-600">{errors.buyerName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink/70">Nomor WhatsApp (opsional)</label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink/70">Pembayaran</label>
                  <div className="mt-1 flex gap-2">
                    {PAYMENT_TYPES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPaymentType(p.value)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                          paymentType === p.value
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-ink/15 text-ink/60 hover:bg-ink/5'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentType === 'dp' && (
                  <div>
                    <label className="block text-sm font-medium text-ink/70">Jumlah Dibayar (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                    />
                    {errors.amountPaid && <p className="mt-1 text-xs text-red-600">{errors.amountPaid}</p>}
                    {!errors.amountPaid && amountPaid && total > 0 && (
                      <p className="mt-1 text-xs text-ink/50">
                        Sisa: {formatRupiah(Math.max(total - Number(amountPaid), 0))}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink/70">Bukti Transaksi</label>

                  <input
                    ref={fileInputRef}
                    id="proof-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProofChange}
                    className="hidden"
                  />

                  {proofPreview ? (
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-ink/15 bg-white p-3">
                      <img src={proofPreview} alt="Preview bukti" className="h-16 w-16 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{proofFile?.name}</p>
                        <p className="text-xs text-green-700">Siap diunggah</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveProof}
                        className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="proof-file-input"
                      className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/20 bg-ink/5 px-4 py-6 text-center transition-colors hover:border-brand hover:bg-brand/5"
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-ink/40"
                      >
                        <path
                          d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm font-semibold text-brand">Pilih Foto Struk / Transfer</span>
                      <span className="text-xs text-ink/40">JPG, PNG, atau WEBP, maksimal 2 MB</span>
                    </label>
                  )}

                  <p className="mt-2 text-xs text-ink/50">
                    Opsional saat ini, tapi status pesanan baru bisa ditandai{' '}
                    <span className="font-medium text-ink/70">Selesai</span> kalau sudah ada bukti transaksi
                    (bisa juga diunggah belakangan lewat Kelola Pesanan).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Catat Transaksi'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {stockAdjustProduct && (
        <StockAdjustModal
          product={stockAdjustProduct}
          onClose={() => setStockAdjustProduct(null)}
          onSaved={refetchProducts}
        />
      )}
    </div>
  )
}

function StockAdjustModal({ product, onClose, onSaved }) {
  const { showToast } = useToast()
  const [delta, setDelta] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const deltaNum = Number(delta)
  const hasValidDelta = delta !== '' && Number.isFinite(deltaNum) && deltaNum !== 0
  const newStock = product.stock + (hasValidDelta ? deltaNum : 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!hasValidDelta) {
      setError('Isi jumlah perubahan stok (boleh negatif buat mengurangi).')
      return
    }
    if (newStock < 0) {
      setError('Stok tidak boleh jadi minus.')
      return
    }
    setSaving(true)
    try {
      await productsApi.update(product.id, { stock: newStock })
      showToast(`Stok ${product.name} diperbarui jadi ${newStock}.`)
      onSaved()
      onClose()
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui stok.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="font-heading text-lg font-bold text-ink">Ubah Stok</h2>
        <p className="mt-1 text-sm text-ink/60">
          {product.name} · Stok sekarang: <span className="font-semibold text-ink">{product.stock}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink/70">
              Jumlah Perubahan (isi negatif buat mengurangi)
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => {
                setDelta(e.target.value)
                setError('')
              }}
              placeholder="contoh: 50 atau -10"
              autoFocus
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            {hasValidDelta && !error && <p className="mt-1 text-xs text-ink/50">Stok jadi: {newStock}</p>}
          </div>

          <p className="text-xs text-ink/40">
            Perubahan ini otomatis tercatat (siapa, berapa, kapan) di Riwayat Stok.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

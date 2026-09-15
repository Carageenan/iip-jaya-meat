import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProducts } from '../../hooks/useProducts'
import { useSettings } from '../../hooks/useSettings'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatRupiah, CATEGORIES, getStockStatus } from '../../lib/format'
import * as productsApi from '../../lib/productsApi'
import * as settingsApi from '../../lib/settingsApi'
import * as ordersApi from '../../lib/ordersApi'
import { useToast } from '../../components/Toast'
import ProductForm from '../../components/admin/ProductForm'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

function SummaryCard({ label, value, tone = 'default', children }) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-200 bg-amber-50'
      : tone === 'danger'
        ? 'border-red-200 bg-red-50'
        : 'border-ink/10 bg-white'
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-ink">{value}</p>
      {children}
    </div>
  )
}

function SettingToggle({ label, enabled, onToggle, disabled }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-2 text-sm">
      <span className="text-ink/70">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          enabled ? 'bg-brand' : 'bg-ink/20'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

export default function Dashboard() {
  usePageTitle('Kelola Produk')
  const { session, signOut } = useAuth()
  const { products, loading, error, refetch } = useProducts()
  const {
    onlineOrderingEnabled,
    cashierEnabled,
    loading: settingsLoading,
    refetch: refetchSettings,
  } = useSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [togglingOrder, setTogglingOrder] = useState(false)
  const [togglingCashier, setTogglingCashier] = useState(false)

  async function handleToggleOnlineOrdering() {
    setTogglingOrder(true)
    try {
      await settingsApi.updateSettings({ online_ordering_enabled: !onlineOrderingEnabled })
      await refetchSettings()
      showToast(`Mode pesan online ${!onlineOrderingEnabled ? 'dinyalakan' : 'dimatikan'}.`)
    } catch (err) {
      showToast(err.message || 'Gagal mengubah pengaturan.', 'error')
    } finally {
      setTogglingOrder(false)
    }
  }

  async function handleToggleCashier() {
    setTogglingCashier(true)
    try {
      await settingsApi.updateSettings({ cashier_enabled: !cashierEnabled })
      await refetchSettings()
      showToast(`Mode kasir ${!cashierEnabled ? 'dinyalakan' : 'dimatikan'}.`)
    } catch (err) {
      showToast(err.message || 'Gagal mengubah pengaturan.', 'error')
    } finally {
      setTogglingCashier(false)
    }
  }

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('semua')
  const [editing, setEditing] = useState(null) // product object or null
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null) // product to delete
  const [busyId, setBusyId] = useState(null)
  const [removing, setRemoving] = useState(false)

  const [orderSummary, setOrderSummary] = useState([])
  const [summaryLoading, setSummaryLoading] = useState(true)

  useEffect(() => {
    ordersApi
      .getOrdersSummary()
      .then(setOrderSummary)
      .catch(() => setOrderSummary([]))
      .finally(() => setSummaryLoading(false))
  }, [])

  const newOrdersCount = useMemo(() => orderSummary.filter((o) => o.status === 'baru').length, [orderSummary])

  const unfinishedOrdersCount = useMemo(
    () => orderSummary.filter((o) => o.status === 'baru' || o.status === 'diproses').length,
    [orderSummary]
  )

  const unpaidTotal = useMemo(
    () =>
      orderSummary
        .filter((o) => o.payment_type === 'dp' && o.status !== 'dibatalkan')
        .reduce((sum, o) => sum + Math.max(o.total - (o.amount_paid ?? 0), 0), 0),
    [orderSummary]
  )

  // Gabung produk yang stoknya < 100 (masih dijual tapi mepet) dan yang ditandai Habis.
  const stockAttention = useMemo(() => {
    return products
      .filter((p) => !p.is_available || (p.stock ?? 0) < 100)
      .map((p) => ({ ...p, habis: !p.is_available }))
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = category === 'semua' || p.category === category
      const matchSearch = p.name.toLowerCase().includes(search.trim().toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, category, search])

  async function handleToggleAvailable(product) {
    setBusyId(product.id)
    try {
      await productsApi.update(product.id, { is_available: !product.is_available })
      showToast('Status produk diperbarui.')
      refetch()
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setRemoving(true)
    try {
      await productsApi.remove(deleting.id)
      if (deleting.image_url) {
        await productsApi.deleteImage(deleting.image_url)
      }
      showToast('Produk berhasil dihapus.')
      setDeleting(null)
      refetch()
    } catch (err) {
      showToast(err.message || 'Gagal menghapus produk.', 'error')
    } finally {
      setRemoving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Kelola Produk</h1>
            <p className="text-xs text-ink/50">{session?.user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SettingToggle
              label="Mode Pesan Online"
              enabled={onlineOrderingEnabled}
              disabled={settingsLoading || togglingOrder}
              onToggle={handleToggleOnlineOrdering}
            />
            <SettingToggle
              label="Mode Kasir"
              enabled={cashierEnabled}
              disabled={settingsLoading || togglingCashier}
              onToggle={handleToggleCashier}
            />
            <Link
              to="/admin/orders"
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Kelola Pesanan
            </Link>
            <Link
              to="/admin/riwayat-stok"
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Riwayat Stok
            </Link>
            <Link
              to="/admin/recap"
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Recap
            </Link>
            {cashierEnabled && (
              <Link
                to="/admin/kasir"
                className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
              >
                Kasir
              </Link>
            )}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Lihat Website
            </a>
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link to="/admin/orders" className="block">
            <SummaryCard label="Pesanan Baru" value={summaryLoading ? '...' : newOrdersCount} />
          </Link>
          <Link to="/admin/orders" className="block">
            <SummaryCard label="Belum Selesai" value={summaryLoading ? '...' : unfinishedOrdersCount} />
          </Link>
          <SummaryCard
            label="Stok Perlu Perhatian"
            value={summaryLoading ? '...' : stockAttention.length}
            tone={stockAttention.length > 0 ? 'warning' : 'default'}
          >
            {stockAttention.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {stockAttention.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-amber-800"
                  >
                    {p.name} {p.habis ? '(Habis)' : `(${p.stock})`}
                  </span>
                ))}
                {stockAttention.length > 4 && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    +{stockAttention.length - 4} lagi
                  </span>
                )}
              </div>
            )}
          </SummaryCard>
          <Link to="/admin/orders" className="block">
            <SummaryCard
              label="Belum Lunas (DP)"
              value={summaryLoading ? '...' : formatRupiah(unpaidTotal)}
              tone={unpaidTotal > 0 ? 'danger' : 'default'}
            />
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
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
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + Tambah Produk
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-ink/5" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              Gagal memuat produk: {error}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-ink/50">Belum ada produk.</p>
          ) : (
            <>
              {/* Table view (desktop) */}
              <div className="hidden overflow-hidden rounded-xl border border-ink/10 bg-white md:block">
                <table className="w-full text-sm">
                  <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
                    <tr>
                      <th className="px-4 py-3">Foto</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">Satuan</th>
                      <th className="px-4 py-3">Stok</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const status = getStockStatus(p)
                      return (
                      <tr key={p.id} className="border-t border-ink/5">
                        <td className="px-4 py-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-ink/10" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                        <td className="px-4 py-3 text-ink/60">
                          {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
                        </td>
                        <td className="px-4 py-3 text-ink/60">{formatRupiah(p.price)}</td>
                        <td className="px-4 py-3 text-ink/60">{p.unit}</td>
                        <td className="px-4 py-3 text-ink/60">{p.stock ?? 0}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => handleToggleAvailable(p)}
                            title="Klik untuk tandai habis/tersedia manual"
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(p)
                              setShowForm(true)
                            }}
                            className="mr-3 text-sm font-medium text-brand hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(p)}
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Card view (mobile) */}
              <div className="space-y-3 md:hidden">
                {filtered.map((p) => {
                  const status = getStockStatus(p)
                  return (
                  <div key={p.id} className="rounded-xl border border-ink/10 bg-white p-4">
                    <div className="flex gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-14 w-14 rounded object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded bg-ink/10" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink/50">
                          {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category} · {p.unit} · Stok {p.stock ?? 0}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand">{formatRupiah(p.price)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => handleToggleAvailable(p)}
                        title="Klik untuk tandai habis/tersedia manual"
                        className={`h-fit rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </button>
                    </div>
                    <div className="mt-3 flex justify-end gap-4 border-t border-ink/5 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(p)
                          setShowForm(true)
                        }}
                        className="text-sm font-medium text-brand"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        className="text-sm font-medium text-red-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {showForm && (
        <ProductForm
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus Produk"
          message={`Hapus produk "${deleting.name}"? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          confirming={removing}
        />
      )}
    </div>
  )
}

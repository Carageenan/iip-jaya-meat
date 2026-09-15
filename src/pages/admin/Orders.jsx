import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../components/Toast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  formatRupiah,
  formatDateTime,
  ORDER_STATUSES,
  getOrderStatusMeta,
  ORDER_SOURCES,
  getOrderSourceMeta,
  PAYMENT_TYPES,
} from '../../lib/format'
import * as ordersApi from '../../lib/ordersApi'

const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' },
  { value: 'total_tertinggi', label: 'Total Tertinggi' },
  { value: 'total_terendah', label: 'Total Terendah' },
]

export default function Orders() {
  usePageTitle('Kelola Pesanan')
  const { showToast } = useToast()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [sourceFilter, setSourceFilter] = useState('semua')
  const [sortBy, setSortBy] = useState('terbaru')
  const [expandedId, setExpandedId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null) // { order, status }
  const [deleting, setDeleting] = useState(null) // order
  const [removing, setRemoving] = useState(false)
  const [proofUrls, setProofUrls] = useState({}) // { [orderId]: signedUrl }
  const [loadingProofId, setLoadingProofId] = useState(null)

  async function refetch() {
    setLoading(true)
    setError(null)
    try {
      const data = await ordersApi.getAllOrders()
      setOrders(data)
    } catch (err) {
      setError(err.message || 'Gagal memuat pesanan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, [])

  const filtered = useMemo(() => {
    let result = orders

    if (statusFilter !== 'semua') {
      result = result.filter((o) => o.status === statusFilter)
    }

    if (sourceFilter !== 'semua') {
      result = result.filter((o) => o.source === sourceFilter)
    }

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (o) => o.customer_name.toLowerCase().includes(q) || o.customer_phone.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'terlama':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'total_tertinggi':
          return b.total - a.total
        case 'total_terendah':
          return a.total - b.total
        case 'terbaru':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

    return result
  }, [orders, statusFilter, sourceFilter, search, sortBy])

  async function handleViewProof(order) {
    if (proofUrls[order.id]) return // sudah dimuat
    setLoadingProofId(order.id)
    try {
      const url = await ordersApi.getProofUrl(order.proof_path)
      setProofUrls((prev) => ({ ...prev, [order.id]: url }))
    } catch (err) {
      showToast(err.message || 'Gagal memuat bukti transaksi.', 'error')
    } finally {
      setLoadingProofId(null)
    }
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return
    const { order, status } = pendingStatus
    setBusyId(order.id)
    try {
      await ordersApi.updateOrderStatus(order.id, status)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
      showToast('Status pesanan diperbarui.')
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status.', 'error')
    } finally {
      setBusyId(null)
      setPendingStatus(null)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setRemoving(true)
    try {
      await ordersApi.removeOrder(deleting.id)
      setOrders((prev) => prev.filter((o) => o.id !== deleting.id))
      showToast('Pesanan dihapus.')
      setDeleting(null)
      if (expandedId === deleting.id) setExpandedId(null)
    } catch (err) {
      showToast(err.message || 'Gagal menghapus pesanan.', 'error')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Kelola Pesanan</h1>
            <Link to="/admin/dashboard" className="text-xs text-brand hover:underline">
              ← Kembali ke Kelola Produk
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / nomor WA..."
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            >
              <option value="semua">Semua Status</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            >
              <option value="semua">Semua Sumber</option>
              {ORDER_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  Urutkan: {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-ink/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Gagal memuat pesanan: {error}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-ink/50">
            {orders.length === 0 ? 'Belum ada pesanan.' : 'Tidak ada pesanan yang cocok.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const status = getOrderStatusMeta(order.status)
              const source = getOrderSourceMeta(order.source)
              const isExpanded = expandedId === order.id
              return (
                <div key={order.id} className="rounded-xl border border-ink/10 bg-white">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink">{order.customer_name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${source.className}`}>
                          {source.label}
                        </span>
                      </div>
                      <p className="text-xs text-ink/50">
                        {order.customer_phone} · {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-brand">{formatRupiah(order.total)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-ink/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Item Pesanan</p>
                      <div className="mt-2 space-y-1">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-ink/70">
                              {item.product_name} <span className="text-ink/40">x{item.quantity}</span>
                            </span>
                            <span className="text-ink">{formatRupiah(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      {order.customer_address && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Alamat</p>
                          <p className="mt-1 text-sm text-ink/70">{order.customer_address}</p>
                        </div>
                      )}

                      {order.notes && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Catatan</p>
                          <p className="mt-1 text-sm text-ink/70">{order.notes}</p>
                        </div>
                      )}

                      {order.source === 'kasir' && (
                        <div className="mt-4 rounded-lg bg-teal-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Pembayaran</p>
                          <p className="mt-1 text-sm text-ink/70">
                            {PAYMENT_TYPES.find((p) => p.value === order.payment_type)?.label ?? '-'} ·{' '}
                            {formatRupiah(order.amount_paid)} dibayar
                            {order.payment_type === 'dp' && (
                              <> · Sisa {formatRupiah(order.total - (order.amount_paid ?? 0))}</>
                            )}
                          </p>
                          {order.proof_path && (
                            <div className="mt-2">
                              {proofUrls[order.id] ? (
                                <a href={proofUrls[order.id]} target="_blank" rel="noreferrer">
                                  <img
                                    src={proofUrls[order.id]}
                                    alt="Bukti transaksi"
                                    className="h-32 w-32 rounded-lg object-cover"
                                  />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleViewProof(order)}
                                  disabled={loadingProofId === order.id}
                                  className="text-sm font-medium text-brand hover:underline disabled:opacity-50"
                                >
                                  {loadingProofId === order.id ? 'Memuat...' : 'Lihat Bukti Transaksi'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Ubah Status</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ORDER_STATUSES.map((s) => (
                              <button
                                key={s.value}
                                type="button"
                                disabled={busyId === order.id || order.status === s.value}
                                onClick={() => setPendingStatus({ order, status: s.value })}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:cursor-default ${
                                  order.status === s.value ? s.className : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeleting(order)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Hapus Pesanan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {pendingStatus && (
        <ConfirmDialog
          title="Ubah Status Pesanan"
          message={`Ubah status pesanan "${pendingStatus.order.customer_name}" jadi "${
            getOrderStatusMeta(pendingStatus.status).label
          }"?`}
          onConfirm={confirmStatusChange}
          onCancel={() => setPendingStatus(null)}
          confirming={busyId === pendingStatus.order.id}
          confirmLabel="Ubah Status"
          confirmingLabel="Menyimpan..."
          tone="brand"
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus Pesanan"
          message={`Hapus pesanan "${deleting.customer_name}"? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          confirming={removing}
        />
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../components/Toast'
import { formatRupiah, formatDateTime, ORDER_STATUSES, getOrderStatusMeta } from '../../lib/format'
import * as ordersApi from '../../lib/ordersApi'

export default function Orders() {
  usePageTitle('Kelola Pesanan')
  const { showToast } = useToast()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('semua')
  const [expandedId, setExpandedId] = useState(null)
  const [busyId, setBusyId] = useState(null)

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
    if (statusFilter === 'semua') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  async function handleStatusChange(order, status) {
    setBusyId(order.id)
    try {
      await ordersApi.updateOrderStatus(order.id, status)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
      showToast('Status pesanan diperbarui.')
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status.', 'error')
    } finally {
      setBusyId(null)
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
          <p className="py-12 text-center text-ink/50">Belum ada pesanan.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const status = getOrderStatusMeta(order.status)
              const isExpanded = expandedId === order.id
              return (
                <div key={order.id} className="rounded-xl border border-ink/10 bg-white">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                  >
                    <div>
                      <p className="font-medium text-ink">{order.customer_name}</p>
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

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Ubah Status</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ORDER_STATUSES.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              disabled={busyId === order.id || order.status === s.value}
                              onClick={() => handleStatusChange(order, s.value)}
                              className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:cursor-default ${
                                order.status === s.value ? s.className : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

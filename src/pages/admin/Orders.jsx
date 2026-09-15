import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../hooks/useAuth'
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

// Kasir cuma boleh pindahin status ke sini. 'selesai' dan 'dibatalkan' cuma admin
// (dikunci juga di database lewat trigger, ini cuma buat UI).
const KASIR_ALLOWED_STATUSES = ['baru', 'diproses']

export default function Orders() {
  usePageTitle('Kelola Pesanan')
  const { showToast } = useToast()
  const { isAdmin } = useAuth()

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
  const [proofUrls, setProofUrls] = useState({}) // { [paymentId]: signedUrl }
  const [loadingProofId, setLoadingProofId] = useState(null) // paymentId
  const [uploadingProofId, setUploadingProofId] = useState(null) // paymentId
  const [paymentDrafts, setPaymentDrafts] = useState({}) // { [orderId]: { amount, file, preview } }
  const [addingPaymentFor, setAddingPaymentFor] = useState(null) // orderId lagi nampilin form
  const [submittingPaymentId, setSubmittingPaymentId] = useState(null) // orderId
  const [deletingPayment, setDeletingPayment] = useState(null) // payment
  const [removingPayment, setRemovingPayment] = useState(false)

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
        (o) => o.customer_name.toLowerCase().includes(q) || (o.customer_phone ?? '').toLowerCase().includes(q)
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

  async function handleViewProof(payment) {
    if (proofUrls[payment.id]) return // sudah dimuat
    setLoadingProofId(payment.id)
    try {
      const url = await ordersApi.getProofUrl(payment.proof_path)
      setProofUrls((prev) => ({ ...prev, [payment.id]: url }))
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
      // Refetch (bukan cuma patch state lokal) biar Riwayat Status ikut kebaruin --
      // baris log barunya ditulis trigger di database, bukan dari sini.
      await refetch()
      showToast('Status pesanan diperbarui.')
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status.', 'error')
    } finally {
      setBusyId(null)
      setPendingStatus(null)
    }
  }

  // Transaksi kasir wajib SEMUA baris pembayarannya punya bukti transaksi
  // sebelum boleh ditandai Selesai -- bukan cukup salah satu cicilan aja.
  // Cek langsung ke order_payments (bukan orders.proof_path, yang cuma cache
  // "bukti terbaru yang ada" -- gak merepresentasikan "semua sudah lengkap").
  function needsProofBeforeComplete(order) {
    if (order.source !== 'kasir') return false
    const payments = order.order_payments || []
    if (payments.length === 0) return true
    return payments.some((p) => !p.proof_path)
  }

  // Kenapa tombol status s dikunci buat order ini -- null kalau tidak dikunci.
  function statusLockReason(order, s) {
    if (!isAdmin && !KASIR_ALLOWED_STATUSES.includes(s.value)) {
      return 'Hanya admin yang boleh mengubah ke status ini.'
    }
    if (s.value === 'selesai' && needsProofBeforeComplete(order)) {
      return 'Upload bukti transaksi dulu sebelum menandai Selesai.'
    }
    return null
  }

  async function handleUploadPaymentProof(payment, file) {
    setUploadingProofId(payment.id)
    try {
      await ordersApi.attachPaymentProof(payment.id, file)
      await refetch()
      showToast('Bukti transaksi berhasil diunggah.')
    } catch (err) {
      showToast(err.message || 'Gagal mengunggah bukti transaksi.', 'error')
    } finally {
      setUploadingProofId(null)
    }
  }

  function updatePaymentDraft(orderId, patch) {
    setPaymentDrafts((prev) => ({ ...prev, [orderId]: { ...prev[orderId], ...patch } }))
  }

  function handlePaymentDraftFile(orderId, e) {
    const file = e.target.files?.[0]
    if (!file) return
    updatePaymentDraft(orderId, { file, preview: URL.createObjectURL(file), error: undefined })
  }

  async function handleAddPayment(order) {
    const draft = paymentDrafts[order.id] || {}
    const amount = Number(draft.amount)
    const sisa = order.total - (order.amount_paid ?? 0)
    if (!draft.amount || amount <= 0) {
      updatePaymentDraft(order.id, { error: 'Jumlah pembayaran wajib diisi.' })
      return
    }
    if (amount > sisa) {
      updatePaymentDraft(order.id, { error: `Jumlah melebihi sisa tagihan (${formatRupiah(sisa)}).` })
      return
    }
    setSubmittingPaymentId(order.id)
    try {
      await ordersApi.addOrderPayment(order.id, amount, draft.file)
      await refetch()
      setPaymentDrafts((prev) => ({ ...prev, [order.id]: undefined }))
      setAddingPaymentFor(null)
      showToast('Pembayaran dicatat.')
    } catch (err) {
      updatePaymentDraft(order.id, { error: err.message || 'Gagal mencatat pembayaran.' })
    } finally {
      setSubmittingPaymentId(null)
    }
  }

  async function handleDeletePayment() {
    if (!deletingPayment) return
    setRemovingPayment(true)
    try {
      await ordersApi.removeOrderPayment(deletingPayment.id)
      await refetch()
      showToast('Baris pembayaran dihapus.')
      setDeletingPayment(null)
    } catch (err) {
      showToast(err.message || 'Gagal menghapus pembayaran.', 'error')
    } finally {
      setRemovingPayment(false)
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
            <Link to={isAdmin ? '/admin/dashboard' : '/admin/kasir'} className="text-xs text-brand hover:underline">
              ← Kembali ke {isAdmin ? 'Kelola Produk' : 'Kasir'}
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
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Pembayaran</p>
                            <p className="text-sm text-ink/70">
                              {PAYMENT_TYPES.find((p) => p.value === order.payment_type)?.label ?? '-'} ·{' '}
                              {formatRupiah(order.amount_paid)} dibayar
                              {order.payment_type === 'dp' && (
                                <> · Sisa {formatRupiah(order.total - (order.amount_paid ?? 0))}</>
                              )}
                            </p>
                          </div>

                          {needsProofBeforeComplete(order) && (
                            <p className="mt-2 text-xs text-amber-800">
                              {order.order_payments?.length
                                ? 'Masih ada cicilan yang belum ada bukti transaksi.'
                                : 'Belum ada bukti transaksi.'}{' '}
                              Status tidak bisa ditandai Selesai sampai semua cicilan punya bukti.
                            </p>
                          )}

                          <div className="mt-3 space-y-2">
                            {[...(order.order_payments || [])]
                              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                              .map((payment, idx) => (
                                <div key={payment.id} className="rounded-lg border border-teal-100 bg-white p-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm">
                                      <span className="font-semibold text-ink">
                                        Cicilan {idx + 1} · {formatRupiah(payment.amount)}
                                      </span>
                                      <span className="ml-2 text-xs text-ink/50">
                                        {formatDateTime(payment.created_at)} · oleh{' '}
                                        {payment.recorded_by_email ?? 'tidak diketahui'}
                                      </span>
                                    </div>
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => setDeletingPayment(payment)}
                                        className="text-xs font-medium text-red-600 hover:underline"
                                      >
                                        Hapus
                                      </button>
                                    )}
                                  </div>

                                  {payment.proof_path ? (
                                    <div className="mt-2">
                                      {proofUrls[payment.id] ? (
                                        <a href={proofUrls[payment.id]} target="_blank" rel="noreferrer">
                                          <img
                                            src={proofUrls[payment.id]}
                                            alt="Bukti transaksi"
                                            className="h-24 w-24 rounded-lg object-cover"
                                          />
                                        </a>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleViewProof(payment)}
                                          disabled={loadingProofId === payment.id}
                                          className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
                                        >
                                          {loadingProofId === payment.id ? 'Memuat...' : 'Lihat Bukti Transaksi'}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <label className="mt-2 inline-block cursor-pointer rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100">
                                      {uploadingProofId === payment.id ? 'Mengunggah...' : 'Unggah Bukti'}
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        disabled={uploadingProofId === payment.id}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) handleUploadPaymentProof(payment, file)
                                          e.target.value = ''
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                              ))}
                          </div>

                          {order.total - (order.amount_paid ?? 0) > 0 &&
                            (addingPaymentFor === order.id ? (
                              <div className="mt-3 rounded-lg border border-teal-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                                  Catat Pembayaran Baru
                                </p>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={`Maks. ${order.total - (order.amount_paid ?? 0)}`}
                                  value={paymentDrafts[order.id]?.amount ?? ''}
                                  onChange={(e) => updatePaymentDraft(order.id, { amount: e.target.value })}
                                  className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                                />
                                <label className="mt-2 inline-block cursor-pointer rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/10">
                                  {paymentDrafts[order.id]?.file ? 'Ganti Bukti' : 'Pilih Bukti (opsional)'}
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handlePaymentDraftFile(order.id, e)}
                                    className="hidden"
                                  />
                                </label>
                                {paymentDrafts[order.id]?.file && (
                                  <span className="ml-2 text-xs text-ink/50">{paymentDrafts[order.id].file.name}</span>
                                )}
                                {paymentDrafts[order.id]?.error && (
                                  <p className="mt-1 text-xs text-red-600">{paymentDrafts[order.id].error}</p>
                                )}
                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddPayment(order)}
                                    disabled={submittingPaymentId === order.id}
                                    className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    {submittingPaymentId === order.id ? 'Menyimpan...' : 'Simpan Pembayaran'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingPaymentFor(null)
                                      setPaymentDrafts((prev) => ({ ...prev, [order.id]: undefined }))
                                    }}
                                    className="rounded-full px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-ink/5"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAddingPaymentFor(order.id)}
                                className="mt-3 text-xs font-semibold text-brand hover:underline"
                              >
                                + Tambah Pembayaran
                              </button>
                            ))}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Ubah Status</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ORDER_STATUSES.map((s) => {
                              const lockReason = statusLockReason(order, s)
                              const locked = Boolean(lockReason)
                              return (
                                <button
                                  key={s.value}
                                  type="button"
                                  disabled={busyId === order.id || order.status === s.value || locked}
                                  onClick={() => setPendingStatus({ order, status: s.value })}
                                  title={lockReason ?? undefined}
                                  className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed ${
                                    order.status === s.value
                                      ? s.className
                                      : locked
                                        ? 'bg-ink/5 text-ink/30'
                                        : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                                  }`}
                                >
                                  {s.label}
                                  {locked && ' 🔒'}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleting(order)}
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            Hapus Pesanan
                          </button>
                        )}
                      </div>

                      {order.order_status_logs?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                            Riwayat Status
                          </p>
                          <div className="mt-2 space-y-1">
                            {[...order.order_status_logs]
                              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                              .map((log) => (
                                <p key={log.id} className="text-xs text-ink/50">
                                  {formatDateTime(log.created_at)} ·{' '}
                                  {log.old_status ? (
                                    <>
                                      {getOrderStatusMeta(log.old_status).label} →{' '}
                                      {getOrderStatusMeta(log.new_status).label}
                                    </>
                                  ) : (
                                    <>Dibuat dengan status {getOrderStatusMeta(log.new_status).label}</>
                                  )}{' '}
                                  <span className="text-ink/40">oleh {log.changed_by_email ?? 'sistem'}</span>
                                </p>
                              ))}
                          </div>
                        </div>
                      )}
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

      {deletingPayment && (
        <ConfirmDialog
          title="Hapus Baris Pembayaran"
          message={`Hapus pembayaran ${formatRupiah(deletingPayment.amount)}? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={handleDeletePayment}
          onCancel={() => setDeletingPayment(null)}
          confirming={removingPayment}
        />
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatRupiah, ORDER_STATUSES } from '../../lib/format'
import * as ordersApi from '../../lib/ordersApi'

const PERIODS = [
  { value: 'hari', label: 'Hari Ini' },
  { value: 'minggu', label: 'Minggu Ini' },
  { value: 'bulan', label: 'Bulan Ini' },
  { value: 'semua', label: 'Semua Waktu' },
]

function periodStart(period) {
  const now = new Date()
  if (period === 'hari') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'minggu') {
    const day = now.getDay() // 0 = Minggu
    const diffToMonday = day === 0 ? 6 : day - 1
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday)
    return monday
  }
  if (period === 'bulan') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return null // semua waktu
}

export default function Recap() {
  usePageTitle('Recap')

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('bulan')

  useEffect(() => {
    ordersApi
      .getOrdersSummary()
      .then(setOrders)
      .catch((err) => setError(err.message || 'Gagal memuat data.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const start = periodStart(period)
    if (!start) return orders
    return orders.filter((o) => new Date(o.created_at) >= start)
  }, [orders, period])

  const kasirOrders = useMemo(
    () => filtered.filter((o) => o.source === 'kasir' && o.status !== 'dibatalkan'),
    [filtered]
  )
  const webOrders = useMemo(() => filtered.filter((o) => o.source === 'web'), [filtered])

  const totalUangMasuk = useMemo(
    () => kasirOrders.reduce((sum, o) => sum + (o.amount_paid ?? 0), 0),
    [kasirOrders]
  )
  const totalPiutang = useMemo(
    () => kasirOrders.reduce((sum, o) => sum + Math.max(o.total - (o.amount_paid ?? 0), 0), 0),
    [kasirOrders]
  )
  const totalNilaiWeb = useMemo(
    () =>
      webOrders.filter((o) => o.status !== 'dibatalkan').reduce((sum, o) => sum + o.total, 0),
    [webOrders]
  )

  const statusBreakdown = useMemo(() => {
    return ORDER_STATUSES.map((s) => ({
      ...s,
      count: filtered.filter((o) => o.status === s.value).length,
    }))
  }, [filtered])

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Recap</h1>
            <Link to="/admin/dashboard" className="text-xs text-brand hover:underline">
              ← Kembali ke Kelola Produk
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  period === p.value ? 'bg-brand text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-ink/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Gagal memuat: {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  Total Uang Masuk (Kasir)
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-green-700">
                  {formatRupiah(totalUangMasuk)}
                </p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  Transaksi Kasir
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-ink">{kasirOrders.length}</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  Belum Lunas (DP)
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-red-600">
                  {formatRupiah(totalPiutang)}
                </p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  Pesanan Web ({webOrders.length})
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-ink">
                  {formatRupiah(totalNilaiWeb)}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink/40">
              "Total Uang Masuk" cuma dari transaksi Kasir (jumlah yang beneran tercatat dibayar).
              Pesanan Web belum ada pembayaran online, jadi nilainya ditampilkan terpisah sebagai
              perkiraan, bukan uang yang sudah pasti masuk.
            </p>

            <div className="mt-8 overflow-hidden rounded-xl border border-ink/10 bg-white">
              <div className="border-b border-ink/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  Jumlah Pesanan per Status ({PERIODS.find((p) => p.value === period)?.label})
                </p>
              </div>
              <div className="divide-y divide-ink/5">
                {statusBreakdown.map((s) => (
                  <div key={s.value} className="flex items-center justify-between px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>
                      {s.label}
                    </span>
                    <span className="font-semibold text-ink">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

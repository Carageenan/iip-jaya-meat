import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatRupiah } from '../../lib/format'
import * as ordersApi from '../../lib/ordersApi'

const SUMMARY_TONES = {
  default: {
    border: 'border-ink/10',
    bg: 'bg-white',
    iconBg: 'bg-ink/5',
    iconColor: 'text-ink/40',
    valueColor: 'text-ink',
  },
  info: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    valueColor: 'text-blue-700',
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    valueColor: 'text-amber-700',
  },
  danger: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-700',
    valueColor: 'text-red-700',
  },
}

function SummaryCard({ icon, label, value, tone = 'default', children }) {
  const t = SUMMARY_TONES[tone]
  return (
    <div className={`rounded-xl border p-4 ${t.border} ${t.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.iconBg} ${t.iconColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</p>
          <p className={`font-heading text-2xl font-bold ${t.valueColor}`}>{value}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

const ICON_PROPS = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }

function InboxIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 12h4l2 3h6l2-3h4M5 12l1.5-6h11L19 12M5 12v6a1 1 0 001 1h12a1 1 0 001-1v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3l10 18H2L12 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10v4M12 17.5v.01" strokeLinecap="round" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 14.5h2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Dipakai di Kelola Produk (admin) dan Kasir (admin + kasir) -- keduanya boleh
// liat kondisi umum toko. Recap (uang masuk dll) sengaja TIDAK di sini, itu
// tetap khusus admin di halaman terpisah.
export default function SummaryBubbles({ products }) {
  const [orderSummary, setOrderSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi
      .getOrdersSummary()
      .then(setOrderSummary)
      .catch(() => setOrderSummary([]))
      .finally(() => setLoading(false))
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

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Link to="/admin/orders" className="block transition-transform hover:-translate-y-0.5">
        <SummaryCard
          icon={<InboxIcon />}
          label="Pesanan Baru"
          value={loading ? '...' : newOrdersCount}
          tone={newOrdersCount > 0 ? 'info' : 'default'}
        />
      </Link>
      <Link to="/admin/orders" className="block transition-transform hover:-translate-y-0.5">
        <SummaryCard
          icon={<ClockIcon />}
          label="Belum Selesai"
          value={loading ? '...' : unfinishedOrdersCount}
          tone={unfinishedOrdersCount > 0 ? 'warning' : 'default'}
        />
      </Link>
      <SummaryCard
        icon={<WarningIcon />}
        label="Stok Perlu Perhatian"
        value={loading ? '...' : stockAttention.length}
        tone={stockAttention.length > 0 ? 'warning' : 'default'}
      >
        {stockAttention.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-amber-200/60 pt-3">
            {stockAttention.slice(0, 4).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-amber-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
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
      <Link to="/admin/orders" className="block transition-transform hover:-translate-y-0.5">
        <SummaryCard
          icon={<WalletIcon />}
          label="Belum Lunas (DP)"
          value={loading ? '...' : formatRupiah(unpaidTotal)}
          tone={unpaidTotal > 0 ? 'danger' : 'default'}
        />
      </Link>
    </div>
  )
}

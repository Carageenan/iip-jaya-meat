export function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number ?? 0)
}

export const CATEGORIES = [
  { value: 'sapi', label: 'Sapi' },
  { value: 'ayam', label: 'Ayam' },
  { value: 'kambing', label: 'Kambing' },
  { value: 'olahan', label: 'Olahan' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const UNITS = ['kg', 'pcs', 'pack', 'ekor']

const LOW_STOCK_THRESHOLD = 100

// Status stok: kalau produk ditandai habis manual -> "Habis".
// Kalau stok >= 100 -> "Tersedia". Kalau stok di bawah 100 -> peringatan stok menipis.
export function getStockStatus(product) {
  if (!product.is_available) {
    return { label: 'Habis', className: 'bg-ink/10 text-ink/50' }
  }
  const stock = product.stock ?? 0
  if (stock < LOW_STOCK_THRESHOLD) {
    return { label: 'Stock kurang dari 100', className: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'Tersedia', className: 'bg-green-100 text-green-700' }
}

export const ORDER_STATUSES = [
  { value: 'baru', label: 'Baru', className: 'bg-blue-100 text-blue-700' },
  { value: 'diproses', label: 'Diproses', className: 'bg-amber-100 text-amber-700' },
  { value: 'selesai', label: 'Selesai', className: 'bg-green-100 text-green-700' },
  { value: 'dibatalkan', label: 'Dibatalkan', className: 'bg-red-100 text-red-700' },
]

export function getOrderStatusMeta(status) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0]
}

export function formatDateTime(isoString) {
  if (!isoString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString))
}

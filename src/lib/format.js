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

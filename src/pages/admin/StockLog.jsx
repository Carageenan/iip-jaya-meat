import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDateTime } from '../../lib/format'
import * as stockLogsApi from '../../lib/stockLogsApi'

export default function StockLog() {
  usePageTitle('Riwayat Stok')

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    stockLogsApi
      .getStockLogs()
      .then(setLogs)
      .catch((err) => setError(err.message || 'Gagal memuat riwayat stok.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return logs
    return logs.filter(
      (l) => l.product_name.toLowerCase().includes(q) || l.changed_by_email?.toLowerCase().includes(q)
    )
  }, [logs, search])

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Riwayat Stok</h1>
            <Link to="/admin/dashboard" className="text-xs text-brand hover:underline">
              ← Kembali ke Kelola Produk
            </Link>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk / email..."
            className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-ink/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Gagal memuat riwayat: {error}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-ink/50">
            {logs.length === 0 ? 'Belum ada perubahan stok tercatat.' : 'Tidak ada yang cocok.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Oleh</th>
                  <th className="px-4 py-3 text-right">Perubahan</th>
                  <th className="px-4 py-3 text-right">Stok Akhir</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-t border-ink/5">
                    <td className="px-4 py-3 text-ink/60">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{log.product_name}</td>
                    <td className="px-4 py-3 text-ink/60">{log.changed_by_email ?? '-'}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        log.delta > 0 ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {log.delta > 0 ? `+${log.delta}` : log.delta}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">{log.new_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/Toast'
import { formatDateTime } from '../../lib/format'
import * as stockLogsApi from '../../lib/stockLogsApi'

export default function StockLog() {
  usePageTitle('Riwayat Stok')
  const { isAdmin } = useAuth()
  const { showToast } = useToast()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterApproval, setFilterApproval] = useState('semua')
  const [approvingId, setApprovingId] = useState(null)

  function refetch() {
    setLoading(true)
    stockLogsApi
      .getStockLogs()
      .then(setLogs)
      .catch((err) => setError(err.message || 'Gagal memuat riwayat stok.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refetch()
  }, [])

  const filtered = useMemo(() => {
    let result = logs
    if (filterApproval === 'menunggu') result = result.filter((l) => !l.approved)
    if (filterApproval === 'disetujui') result = result.filter((l) => l.approved)

    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (l) => l.product_name.toLowerCase().includes(q) || l.changed_by_email?.toLowerCase().includes(q)
      )
    }
    return result
  }, [logs, search, filterApproval])

  const pendingCount = useMemo(() => logs.filter((l) => !l.approved).length, [logs])

  async function handleApprove(log) {
    setApprovingId(log.id)
    try {
      await stockLogsApi.approveStockLog(log.id)
      setLogs((prev) =>
        prev.map((l) => (l.id === log.id ? { ...l, approved: true } : l))
      )
      showToast(`Penambahan stok "${log.product_name}" ditandai diketahui.`)
    } catch (err) {
      showToast(err.message || 'Gagal menyetujui.', 'error')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Riwayat Stok</h1>
            <Link to={isAdmin ? '/admin/dashboard' : '/admin/kasir'} className="text-xs text-brand hover:underline">
              ← Kembali ke {isAdmin ? 'Kelola Produk' : 'Kasir'}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk / email..."
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            />
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            >
              <option value="semua">Semua</option>
              <option value="menunggu">Menunggu Diketahui{pendingCount > 0 ? ` (${pendingCount})` : ''}</option>
              <option value="disetujui">Sudah Diketahui</option>
            </select>
          </div>
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
                  <th className="px-4 py-3">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Aksi</th>}
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
                    <td className="px-4 py-3">
                      {log.approved ? (
                        <span
                          className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                          title={log.approved_by_email ? `Diketahui oleh ${log.approved_by_email}` : undefined}
                        >
                          Diketahui
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Menunggu
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {!log.approved && (
                          <button
                            type="button"
                            disabled={approvingId === log.id}
                            onClick={() => handleApprove(log)}
                            className="text-sm font-medium text-brand hover:underline disabled:opacity-50"
                          >
                            {approvingId === log.id ? 'Menyimpan...' : 'Tandai Diketahui'}
                          </button>
                        )}
                      </td>
                    )}
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

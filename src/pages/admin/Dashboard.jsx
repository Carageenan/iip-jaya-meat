import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProducts } from '../../hooks/useProducts'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatRupiah, CATEGORIES } from '../../lib/format'
import * as productsApi from '../../lib/productsApi'
import { useToast } from '../../components/Toast'
import ProductForm from '../../components/admin/ProductForm'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

export default function Dashboard() {
  usePageTitle('Kelola Produk')
  const { session, signOut } = useAuth()
  const { products, loading, error, refetch } = useProducts()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('semua')
  const [editing, setEditing] = useState(null) // product object or null
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null) // product to delete
  const [busyId, setBusyId] = useState(null)
  const [removing, setRemoving] = useState(false)

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
          <div className="flex items-center gap-3">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
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
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => handleToggleAvailable(p)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              p.is_available ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'
                            }`}
                          >
                            {p.is_available ? 'Tersedia' : 'Habis'}
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card view (mobile) */}
              <div className="space-y-3 md:hidden">
                {filtered.map((p) => (
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
                          {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category} · {p.unit}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-brand">{formatRupiah(p.price)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => handleToggleAvailable(p)}
                        className={`h-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                          p.is_available ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'
                        }`}
                      >
                        {p.is_available ? 'Tersedia' : 'Habis'}
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
                ))}
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

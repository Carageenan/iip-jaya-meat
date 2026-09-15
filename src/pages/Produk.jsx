import { useMemo, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { usePageTitle } from '../hooks/usePageTitle'
import { CATEGORIES } from '../lib/format'
import ProductCard from '../components/ProductCard'

export default function Produk() {
  usePageTitle('Produk')
  const { products, loading, error, refetch } = useProducts()
  const [category, setCategory] = useState('semua')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = category === 'semua' || p.category === category
      const matchSearch = p.name.toLowerCase().includes(search.trim().toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, category, search])

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Produk Kami</h1>
      <p className="mt-2 text-ink/60">Daftar daging segar yang tersedia hari ini.</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('semua')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              category === 'semua' ? 'bg-brand text-white' : 'bg-white text-ink/70 border border-ink/10'
            }`}
          >
            Semua
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === c.value ? 'bg-brand text-white' : 'bg-white text-ink/70 border border-ink/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama produk..."
          className="w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm sm:w-64"
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-ink/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Gagal memuat produk: {error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-ink/50">Belum ada produk yang cocok.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

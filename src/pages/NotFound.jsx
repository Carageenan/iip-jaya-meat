import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-heading text-5xl font-bold text-brand">404</h1>
      <p className="mt-4 text-ink/70">Halaman yang Anda cari tidak ditemukan.</p>
      <Link to="/" className="mt-6 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
        Kembali ke Beranda
      </Link>
    </div>
  )
}

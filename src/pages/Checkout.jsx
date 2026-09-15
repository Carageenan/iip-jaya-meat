import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatRupiah } from '../lib/format'
import { buildWhatsappUrl } from '../lib/siteConfig'
import * as ordersApi from '../lib/ordersApi'

export default function Checkout() {
  usePageTitle('Checkout')
  const { items, totalPrice, clear } = useCart()

  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [order, setOrder] = useState(null)

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nama wajib diisi.'
    if (!form.phone.trim()) errs.phone = 'Nomor WhatsApp wajib diisi.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const created = await ordersApi.createOrder({ customer: form, items, total: totalPrice })
      setOrder({ id: created.id, total: totalPrice, items })
      clear()
    } catch (err) {
      setSubmitError(err.message || 'Gagal membuat pesanan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (order) {
    const summaryLines = order.items
      .map((i) => `- ${i.name} x${i.quantity} (${formatRupiah(i.price * i.quantity)})`)
      .join('\n')
    const waMessage = `Halo, saya baru saja membuat pesanan di website:\n\n${summaryLines}\n\nTotal: ${formatRupiah(
      order.total
    )}\n\nNama: ${form.name}\nWhatsApp: ${form.phone}${form.address ? `\nAlamat: ${form.address}` : ''}`

    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>
        <h1 className="mt-4 font-heading text-3xl font-bold text-ink">Pesanan Diterima</h1>
        <p className="mt-2 text-ink/60">
          Terima kasih, {form.name}. Pesanan kamu sudah masuk dan akan segera kami konfirmasi.
        </p>

        <div className="mt-6 rounded-xl border border-ink/10 bg-white p-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Total Pesanan</p>
          <p className="mt-1 font-heading text-2xl font-bold text-brand">{formatRupiah(order.total)}</p>
        </div>

        <p className="mt-6 text-sm text-ink/60">
          Biar lebih cepat diproses, konfirmasi juga pesanan kamu langsung via WhatsApp.
        </p>
        <a
          href={buildWhatsappUrl(waMessage)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Konfirmasi via WhatsApp
        </a>
        <div className="mt-4">
          <Link to="/" className="text-sm font-medium text-ink/60 hover:text-brand">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-bold text-ink">Keranjang Kosong</h1>
        <p className="mt-2 text-ink/60">Tambahkan produk dulu sebelum checkout.</p>
        <Link
          to="/produk"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Lihat Produk
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70">Nama Lengkap</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70">Nomor WhatsApp</label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70">Alamat Pengiriman / Pengambilan</label>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70">Catatan (opsional)</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <p className="text-xs text-ink/50">
            Belum ada pembayaran online. Setelah pesanan masuk, kami akan hubungi kamu untuk konfirmasi dan cara
            pembayaran.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </form>

        <div className="h-fit rounded-xl border border-ink/10 bg-white p-6">
          <h2 className="font-heading text-lg font-bold text-ink">Ringkasan Pesanan</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink/70">
                  {item.name} <span className="text-ink/40">x{item.quantity}</span>
                </span>
                <span className="font-medium text-ink">{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-heading text-lg font-bold text-brand">{formatRupiah(totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

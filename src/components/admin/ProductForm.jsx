import { useState } from 'react'
import { CATEGORIES, UNITS } from '../../lib/format'
import * as productsApi from '../../lib/productsApi'
import { useToast } from '../Toast'

const emptyForm = {
  name: '',
  description: '',
  category: 'sapi',
  price: '',
  unit: 'kg',
  is_available: true,
  sort_order: 0,
  image_url: '',
}

export default function ProductForm({ product, onClose, onSaved }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(product ? { ...emptyForm, ...product } : emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(product?.image_url || '')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nama produk wajib diisi.'
    if (form.price === '' || Number(form.price) < 0) errs.price = 'Harga wajib diisi dan tidak boleh negatif.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    try {
      let imageUrl = form.image_url
      let oldImageUrl = null

      if (imageFile) {
        const uploaded = await productsApi.uploadImage(imageFile)
        oldImageUrl = product?.image_url
        imageUrl = uploaded.url
      }

      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        category: form.category,
        price: Number(form.price),
        unit: form.unit,
        is_available: form.is_available,
        sort_order: Number(form.sort_order) || 0,
        image_url: imageUrl || null,
      }

      if (product) {
        await productsApi.update(product.id, payload)
      } else {
        await productsApi.create(payload)
      }

      if (oldImageUrl) {
        await productsApi.deleteImage(oldImageUrl)
      }

      showToast(product ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.')
      onSaved()
      onClose()
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan produk.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-ink">
            {product ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button type="button" onClick={onClose} className="text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70">Nama Produk</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70">Deskripsi</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/70">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70">Satuan</label>
              <select
                value={form.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/70">Harga (Rp)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70">Urutan Tampil</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => handleChange('sort_order', e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => handleChange('is_available', e.target.checked)}
              className="h-4 w-4 rounded border-ink/30 text-brand focus:ring-brand"
            />
            Tersedia
          </label>

          <div>
            <label className="block text-sm font-medium text-ink/70">Foto Produk</label>
            {preview && (
              <img src={preview} alt="Preview" className="mt-2 h-32 w-32 rounded-lg object-cover" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-ink/70"
            />
            <p className="mt-1 text-xs text-ink/40">JPG/PNG/WEBP, maksimal 2 MB.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

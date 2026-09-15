import { supabase } from './supabaseClient'

const BUCKET = 'product-images'
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function getAll() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function create(product) {
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return data
}

export async function update(id, product) {
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function remove(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
}

export async function uploadImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format foto harus JPG, PNG, atau WEBP.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran foto maksimal 2 MB.')
  }

  const path = `${Date.now()}-${sanitizeFileName(file.name)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function deleteImage(imageUrl) {
  if (!imageUrl) return
  const marker = `/${BUCKET}/`
  const idx = imageUrl.indexOf(marker)
  if (idx === -1) return
  const path = imageUrl.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}

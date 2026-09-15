import { supabase } from './supabaseClient'

// Dipanggil dari halaman Checkout (publik, belum login) -> insert order + order_items.
// PENTING: tidak pakai .select() setelah insert. Anon sengaja tidak dikasih izin SELECT
// ke orders/order_items (privasi, biar customer tidak bisa baca pesanan orang lain), jadi
// minta representasi balik (.select()) akan gagal RLS. id di-generate di client sendiri.
export async function createOrder({ customer, items, total }) {
  const orderId = crypto.randomUUID()

  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    customer_name: customer.name,
    customer_phone: customer.phone,
    customer_address: customer.address || null,
    notes: customer.notes || null,
    total,
  })
  if (orderError) throw orderError

  const orderItems = items.map((item) => ({
    order_id: orderId,
    product_id: item.id,
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw itemsError

  return { id: orderId }
}

// Dipanggil dari admin/kasir (harus login) -> butuh baca semua order + itemnya
// + riwayat perubahan status & pembayarannya sekalian (biar ga perlu fetch terpisah per order).
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_status_logs(*), order_payments(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Versi ringan buat ringkasan/laporan (bubble di Kelola Produk, halaman Recap) --
// gak perlu order_items/order_status_logs, cukup kolom yang dipake buat ngitung.
export async function getOrdersSummary() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, source, payment_type, total, amount_paid, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function removeOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

// --- Kasir (transaksi offline dicatat admin/kasir yang sudah login) ---

const PROOF_BUCKET = 'order-proofs'
const PROOF_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const PROOF_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
}

// Bucket bukti transaksi private, jadi cuma simpan path-nya, bukan public URL.
export async function uploadProof(file) {
  if (!PROOF_ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format bukti transaksi harus JPG, PNG, atau WEBP.')
  }
  if (file.size > PROOF_MAX_SIZE) {
    throw new Error('Ukuran bukti transaksi maksimal 2 MB.')
  }
  const path = `${Date.now()}-${sanitizeFileName(file.name)}`
  const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

// Bucket private -> butuh signed URL sementara buat nampilin gambarnya di admin.
export async function getProofUrl(path) {
  const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(path, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

// --- Riwayat pembayaran (order_payments) --------------------------------
// DP bisa dicicil beberapa kali, tiap baris punya jumlah + bukti sendiri.
// orders.amount_paid & orders.proof_path otomatis disinkronkan trigger
// database tiap baris ini berubah -- jadi kode yang cuma baca dua kolom itu
// (bubble ringkasan, Recap, needsProofBeforeComplete) tetap jalan apa adanya.

// Catat pembayaran baru buat order yang udah ada (DP awal, cicilan
// berikutnya, atau pelunasan). recorded_by/email diisi trigger dari sesi.
export async function addOrderPayment(orderId, amount, file) {
  const proofPath = file ? await uploadProof(file) : null
  const { data, error } = await supabase
    .from('order_payments')
    .insert({ order_id: orderId, amount, proof_path: proofPath })
    .select()
    .single()
  if (error) throw error
  return data
}

// Tempel bukti transaksi ke baris pembayaran yang belum ada fotonya.
export async function attachPaymentProof(paymentId, file) {
  const path = await uploadProof(file)
  const { data, error } = await supabase
    .from('order_payments')
    .update({ proof_path: path })
    .eq('id', paymentId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Hapus baris pembayaran yang salah catat (admin only, dikunci RLS).
export async function removeOrderPayment(id) {
  const { error } = await supabase.from('order_payments').delete().eq('id', id)
  if (error) throw error
}

// Admin sudah login, jadi boleh .select() balik hasil insert (beda dari checkout publik).
// Status otomatis "selesai" HANYA kalau ada bukti transaksi. Tanpa bukti, order masuk
// sebagai "baru" -- kasir/admin wajib upload bukti dulu (lewat halaman ini atau Kelola
// Pesanan) baru bisa ditandai Selesai. Lihat juga Orders.jsx yang mengunci tombol Selesai.
export async function createCashierOrder({ customer, items, total, paymentType, amountPaid, proofPath }) {
  const initialAmount = paymentType === 'dp' ? amountPaid : total

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: customer.name,
      customer_phone: customer.phone || null,
      source: 'kasir',
      status: proofPath ? 'selesai' : 'baru',
      total,
      payment_type: paymentType,
    })
    .select()
    .single()
  if (orderError) throw orderError

  // Baris pembayaran pertama -- trigger database langsung ngisi
  // orders.amount_paid/proof_path dari sini, gak perlu diisi manual di atas.
  const { error: paymentError } = await supabase
    .from('order_payments')
    .insert({ order_id: order.id, amount: initialAmount, proof_path: proofPath || null })
  if (paymentError) throw paymentError

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) throw itemsError

  return order
}

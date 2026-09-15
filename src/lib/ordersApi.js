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

// Dipanggil dari admin (harus login) -> butuh baca semua order + itemnya.
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
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

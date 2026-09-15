import { supabase } from './supabaseClient'

export async function getStockLogs() {
  const { data, error } = await supabase
    .from('stock_logs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Versi ringan buat bubble ringkasan -- cuma yang belum disetujui admin.
export async function getPendingStockApprovals() {
  const { data, error } = await supabase
    .from('stock_logs')
    .select('id, product_name, delta, new_stock, changed_by_email, created_at')
    .eq('approved', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// approved_by/approved_by_email/approved_at diisi otomatis oleh trigger di
// database dari sesi yang approve -- client cuma perlu kirim approved:true.
export async function approveStockLog(id) {
  const { data, error } = await supabase
    .from('stock_logs')
    .update({ approved: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

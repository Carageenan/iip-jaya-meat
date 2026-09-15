import { supabase } from './supabaseClient'

export async function getStockLogs() {
  const { data, error } = await supabase
    .from('stock_logs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

import { supabase } from './supabaseClient'

const SETTINGS_ID = 1

export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', SETTINGS_ID).single()
  if (error) throw error
  return data
}

export async function updateSettings(patch) {
  const { data, error } = await supabase
    .from('settings')
    .update(patch)
    .eq('id', SETTINGS_ID)
    .select()
    .single()
  if (error) throw error
  return data
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as settingsApi from '../lib/settingsApi'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const data = await settingsApi.getSettings()
      setSettings(data)
    } catch {
      // Tabel settings belum ada / gagal dimuat -> anggap mode online order mati (aman, sesuai default).
      setSettings({ online_ordering_enabled: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const onlineOrderingEnabled = settings?.online_ordering_enabled ?? false

  return (
    <SettingsContext.Provider value={{ onlineOrderingEnabled, loading, refetch }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings harus dipakai di dalam SettingsProvider')
  return ctx
}

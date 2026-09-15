import { useEffect } from 'react'
import { siteConfig } from '../lib/siteConfig'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${siteConfig.name}` : siteConfig.name
  }, [title])
}

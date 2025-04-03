import { useState, useEffect } from 'react'

/**
 * Hook to safely detect if we're running in a browser environment
 * @returns {boolean} True if running in browser, false during SSR
 */
export function useIsBrowser() {
  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    setIsBrowser(true)
  }, [])

  return isBrowser
}

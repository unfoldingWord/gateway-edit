import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useIsBrowser } from './useIsBrowser'

export function useAppNavigation() {
  const isBrowser = useIsBrowser()
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState('/')
  const isNextJs = isBrowser && window.__NEXT_DATA__

  useEffect(() => {
    if (isBrowser) {
      setCurrentPath(window.location.pathname)
    }
  }, [isBrowser])

  useEffect(() => {
    if (!isNextJs && isBrowser) {
      const handlePopState = () => {
        setCurrentPath(window.location.pathname)
      }
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [isNextJs, isBrowser])

  const navigate = (path) => {
    if (isNextJs) {
      router.push(path)
    } else if (isBrowser) {
      window.history.pushState({}, '', path)
      setCurrentPath(path)
    }
  }

  return {
    navigate,
    currentPath: isNextJs ? router?.pathname : currentPath,
    isNextJs
  }
}

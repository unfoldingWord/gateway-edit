import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export function useAppNavigation() {
  const isNextJs = typeof window !== 'undefined' && window.__NEXT_DATA__
  const nextRouter = isNextJs ? useRouter() : null
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    if (!isNextJs) {
      const handlePopState = () => {
        setCurrentPath(window.location.pathname)
      }
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [isNextJs])

  const navigate = (path) => {
    if (isNextJs) {
      nextRouter.push(path)
    } else {
      window.history.pushState({}, '', path)
      setCurrentPath(path)
    }
  }

  return {
    navigate,
    currentPath: isNextJs ? nextRouter?.pathname : currentPath,
    isNextJs
  }
}

import React, { Suspense } from 'react'

// Detect if we're using Vite by checking for import.meta which is Vite-specific
const isVite = typeof import.meta !== 'undefined'

/**
 * Creates a dynamically imported component that works in both Vite and Next.js
 * @param {Function} importFunc - The import function (e.g., () => import('./MyComponent'))
 * @param {Object} options - Options for the dynamic import
 * @param {React.ComponentType} options.loading - Loading component to show while loading
 * @returns {React.ComponentType} - The dynamically imported component
 */
export function createDynamicComponent(importFunc, { loading: LoadingComponent } = {}) {
  if (isVite) {
    // For Vite, use React.lazy with Suspense
    const LazyComponent = React.lazy(importFunc)
    return function DynamicComponent(props) {
      return (
        <Suspense fallback={LoadingComponent ? <LoadingComponent /> : null}>
          <LazyComponent {...props} />
        </Suspense>
      )
    }
  } else {
    // For Next.js, use next/dynamic
    try {
      // Dynamic import of next/dynamic
      const dynamic = require('next/dynamic').default
      return dynamic(importFunc, {
        loading: LoadingComponent,
      })
    } catch (error) {
      // Fallback to React.lazy if next/dynamic is not available
      console.warn('next/dynamic not available, falling back to React.lazy')
      const LazyComponent = React.lazy(importFunc)
      return function DynamicComponent(props) {
        return (
          <Suspense fallback={LoadingComponent ? <LoadingComponent /> : null}>
            <LazyComponent {...props} />
          </Suspense>
        )
      }
    }
  }
}

export default createDynamicComponent

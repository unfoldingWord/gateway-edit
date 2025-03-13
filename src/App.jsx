import React, { useEffect } from 'react'
import { ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import StoreContextProvider from '@context/StoreContext'
import AuthContextProvider from '@context/AuthContext'
import { APP_NAME } from '@common/constants'
import AppHead from '@components/AppHead'
import Layout from './components/Layout'
import WorkspaceContainer from './components/WorkspaceContainer'
import theme from './theme'
import '@styles/globals.css'
import { useAppNavigation } from './hooks/useAppNavigation'
import AccountSettings from './components/AccountSettings'
import { DebugPanel } from './debug/DebugPanel'

function App() {
  const { currentPath, isNextJs } = useAppNavigation()

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')

    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  const renderContent = () => {
    if (isNextJs) {
      return null // Next.js handles its own routing
    }

    switch (currentPath) {
      case '/settings':
        return <AccountSettings />
      default:
        return (
          // Your default app content here
          <WorkspaceContainer />
        )
    }
  }

  return (
    <>
      <AppHead title={APP_NAME} />
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <AuthContextProvider>
          <StoreContextProvider>
            <Layout>{renderContent()}</Layout>
          </StoreContextProvider>
        </AuthContextProvider>
      </ThemeProvider>
      {/* <DebugPanel
        config={{
          userActions: {
            enabled: true,
            trackScroll: false, // Disable scroll tracking
            ignoreElements: [
              '.no-track'
            ],
          },
          initialFilters: ['error', 'network', 'user-action'], // Start with error and network events filtered
          enableConsole: true, // Disable console logging
        }}
      /> */}
    </>
  )
}

export default App

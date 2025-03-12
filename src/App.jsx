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

function App() {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')

    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  return (
    <>
      <AppHead title={APP_NAME} />
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <AuthContextProvider>
          <StoreContextProvider>
            <Layout>
              <WorkspaceContainer />
            </Layout>
          </StoreContextProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </>
  )
}

export default App

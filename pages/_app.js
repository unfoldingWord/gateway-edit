import { useEffect } from 'react'
import { ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import ReferenceContextProvider from '@context/ReferenceContext'
import AuthContextProvider from '@context/AuthContext'
import { appName } from '@common/constants'
import AppHead from '@components/AppHead'
import theme from '../src/theme'
import '@styles/globals.css'

function Application({ Component, pageProps }) {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  return (
    <>
      <AppHead title={appName} />
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <AuthContextProvider>
          <ReferenceContextProvider>
            <Component {...pageProps} />
          </ReferenceContextProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </>
  )
}

export default Application

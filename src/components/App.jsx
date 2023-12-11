import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import StoreContextProvider from '@context/StoreContext'
import AuthContextProvider from '@context/AuthContext'
import { APP_NAME } from '@common/constants'
import theme from '../theme'
import '@styles/globals.css'

export default function Application() {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')

    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  return (
    <>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <AuthContextProvider>
          <StoreContextProvider>
            {<Component {...pageProps} />}
          </StoreContextProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </>
  )
}

Application.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  pageProps: PropTypes.object,
}

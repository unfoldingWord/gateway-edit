import { useState, useEffect } from 'react'
import localforage from 'localforage'
import { ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import { AuthenticationContextProvider } from 'gitea-react-toolkit'
import ReferenceContextProvider from '@context/ReferenceContext'
import { appName, base_url, tokenid } from '@common/constants'
import Head from '@components/Head'
import theme from '../src/theme'
import '@styles/globals.css'

function Application({ Component, pageProps }) {
  const [authentication, setAuthentication] = useState(null)

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles)
    }
  }, [])

  const myAuthStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'my-auth-store',
  })

  const getAuth = async () => {
    const auth = await myAuthStore.getItem('authentication')
    return auth
  }

  const saveAuth = async authentication => {
    if (authentication === undefined || authentication === null) {
      await myAuthStore.removeItem('authentication')
    } else {
      await myAuthStore
        .setItem('authentication', authentication)
        .then(function (authentication) {
          console.info(
            'saveAuth() success. authentication user is:',
            authentication.user.login
          )
        })
        .catch(function (err) {
          // This code runs if there were any errors
          console.info('saveAuth() failed. err:', err)
          console.info('saveAuth() failed. authentication:', authentication)
        })
    }
  }

  return (
    <>
      <Head title={appName} />
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <AuthenticationContextProvider
          config={{
            server: base_url,
            tokenid,
          }}
          authentication={authentication}
          onAuthentication={setAuthentication}
          loadAuthentication={getAuth}
          saveAuthentication={saveAuth}
        >
          <ReferenceContextProvider>
            <Component {...pageProps} />
          </ReferenceContextProvider>
        </AuthenticationContextProvider>
      </ThemeProvider>
    </>
  )
}

export default Application

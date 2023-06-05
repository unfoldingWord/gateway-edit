import React, { createContext, useEffect, useState } from 'react'
import localforage from 'localforage'
import { AuthenticationContextProvider } from 'gitea-react-toolkit'
import {
  BASE_URL,
  QA_BASE_URL,
  CLOSE,
  HTTP_GET_MAX_WAIT_TIME,
  TOKEN_ID,
} from '@common/constants'
import {
  doFetch,
  processNetworkError,
  unAuthenticated,
} from '@utils/network'
import NetworkErrorPopup from '@components/NetworkErrorPopUp'

export const AuthContext = createContext({})

export default function AuthContextProvider(props) {
  const [authentication, setAuthentication] = useState(null)
  const [networkError, setNetworkError] = useState(null)
  // Do not persist server settings across logins
  const [server, setServer] = useState('')

  // note: window is only available on client side, so the below is placed into a hook
  // hooks only run on client side.
  useEffect( () => {
  /*
    Determine the default value for server here.
    if non-prod url, then let default be qa; else prod
  */
    console.log('URL is:',window.location.href)

    if ( window.location.href.includes('localhost')
        || window.location.href.includes('develop')
        || window.location.href.includes('deploy-preview')
    ) {
      console.log('local or develop or preview, defaulting to ',QA_BASE_URL)
      setServer(QA_BASE_URL)
    } else {
      console.log('production server, defaulting to ',BASE_URL)
      setServer(BASE_URL)
    }
  }, [] )


  /**
   * in the case of a network error, process and display error dialog
   * @param {string|Error} error - initial error message or object
   * @param {number} httpCode - http code returned
   */
  function processError(error, httpCode=0) {
    processNetworkError(error, httpCode, null, null, setNetworkError, null, null )
  }

  const myAuthStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'my-auth-store',
  })

  const getAuth = async () => {
    const auth = await myAuthStore.getItem('authentication')

    if (auth) { // verify that auth is still valid
      doFetch(`${server}/api/v1/user`, auth, HTTP_GET_MAX_WAIT_TIME)
        .then(response => {
          const httpCode = response?.status || 0

          if (httpCode !== 200) {
            console.log(`TranslationSettings - error fetching user info, status code ${httpCode}`)

            if (unAuthenticated(httpCode)) {
              console.log(`TranslationSettings - user not authenticated, going to login`)
              logout()
            } else {
              processError(null, httpCode)
            }
          }
        }).catch(e => {
          console.warn(`TranslationSettings - hard error fetching user info, error=`, e)
          processError(e)
        })
    }
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
            authentication.user.login,
          )
        })
        .catch(function (err) {
          // This code runs if there were any errors
          console.info('saveAuth() failed. err:', err)
          console.info('saveAuth() failed. authentication:', authentication)
        })
    }
  }

  const onError = (e) => {
    console.warn('AuthContextProvider - auth error', e)
    processError(e?.errorMessage)
  }

  async function logout() {
    await myAuthStore.removeItem('authentication')
    setAuthentication(null)
  }

  const value = {
    state: {
      authentication,
      networkError,
      server,
    },
    actions: {
      logout,
      setNetworkError,
      setServer,
    },
  }

  return (
    <AuthContext.Provider value={value}>
      <AuthenticationContextProvider
        config={{
          server,
          tokenid: TOKEN_ID,
          timeout: HTTP_GET_MAX_WAIT_TIME,
        }}
        authentication={authentication}
        onAuthentication={setAuthentication}
        loadAuthentication={getAuth}
        saveAuthentication={saveAuth}
        onError={onError}
      >
        {props.children}
      </AuthenticationContextProvider>
      { !!networkError &&
        <NetworkErrorPopup
          networkError={networkError}
          setNetworkError={setNetworkError}
          closeButtonStr={CLOSE}
        />
      }
    </AuthContext.Provider>
  )
}

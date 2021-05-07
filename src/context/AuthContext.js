import React, { useState, createContext } from 'react'
import localforage from 'localforage'
import { AuthenticationContextProvider } from 'gitea-react-toolkit'
import { BASE_URL, TOKEN_ID } from '@common/constants'
import { processNetworkError, unAuthenticated } from '@utils/network'

export const AuthContext = createContext({})

export default function AuthContextProvider(props) {
  const [authentication, setAuthentication] = useState(null)
  const [networkError, setNetworkError] = useState(null)

  /**
   * in the case of a network error, process and display error dialog
   * @param {string} errorMessage - optional error message returned
   * @param {number} httpCode - http code returned
   */
  function processError(errorMessage, httpCode=0) {
    processNetworkError(errorMessage, httpCode, setNetworkError, null, null )
  }

  const myAuthStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'my-auth-store',
  })

  const getAuth = async () => {
    const auth = await myAuthStore.getItem('authentication')

    if (auth) { // verify that auth is still valid
      fetch('https://git.door43.org/api/v1/user', { ...auth.config })
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
          processError('Unknown networking error')
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

  async function logout() {
    await myAuthStore.removeItem('authentication')
    setAuthentication(null)
  }

  const value = {
    authentication,
    logout,
    networkError,
    setNetworkError,
  }

  return (
    <AuthContext.Provider value={value}>
      <AuthenticationContextProvider
        config={{
          server: BASE_URL,
          tokenid: TOKEN_ID,
        }}
        authentication={authentication}
        onAuthentication={setAuthentication}
        loadAuthentication={getAuth}
        saveAuthentication={saveAuth}
      >
        {props.children}
      </AuthenticationContextProvider>
    </AuthContext.Provider>
  )
}

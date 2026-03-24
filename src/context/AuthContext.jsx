import React, { createContext, useState } from 'react'
import localforage from 'localforage'
import { AuthenticationContextProvider } from 'gitea-react-toolkit'
import {
  BASE_URL,
  CLOSE,
  HTTP_GET_MAX_WAIT_TIME,
  QA_BASE_URL,
  SERVER_KEY,
  TOKEN_ID,
} from '@common/constants'
import {
  doFetch,
  processNetworkError,
  unAuthenticated,
} from '@utils/network'
import NetworkErrorPopup from '@components/NetworkErrorPopUp'
import useLocalStorage from '@hooks/useLocalStorage'

export const AuthContext = createContext({})

export default function AuthContextProvider(props) {
  const [authentication, setAuthentication] = useState(null)
  const [networkError, setNetworkError] = useState(null)
  const defaultServer = (process.env.NEXT_PUBLIC_BUILD_CONTEXT === 'production') ? BASE_URL : QA_BASE_URL
  const [server, setServer] = useLocalStorage(SERVER_KEY, defaultServer)

  /**
   * in the case of a network error, process and display error dialog
   * @param {string|Error} error - initial error message or object
   * @param {number} httpCode - http code returned
   */
  function processError(error, httpCode=0) {
    processNetworkError(error, httpCode, logout, null, setNetworkError, null, null )
  }

  const myAuthStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'my-auth-store',
  })

  /**
   * check if user is authenticated.  Returns the various verification final results
   * @returns {Promise<{authenticated: boolean, authenticationError: boolean, otherError: boolean}>} - authentication status
   */
  async function checkUserAuthentication() {
    let auth = authentication // get if previously authenticated
    const results = {
      authenticated: false,
      authenticationError: false,
      otherError: false,
    }

    if (auth) { // if previously authenticated, verify still authenticated
      try {
        const response = await doFetch(`${server}/api/v1/user`, auth, HTTP_GET_MAX_WAIT_TIME);
        const httpCode = response?.status || 0;
        if (httpCode === 200) {
          results.authenticated = true
        } else if (unAuthenticated(httpCode)) {
          results.authenticationError = `Server returned ${httpCode}`
        } else {
          results.otherError = `Server returned ${httpCode}`
        }
      } catch (e) {
        if (e.toString().includes('401')) { // check if 401 code in exception
          results.authenticationError = e.toString();
        } else {
          results.otherError = e.toString();
        }
      }
    }
    return results;
  }

  /**
   * Verifies if the user is currently authenticated.  This will return false if there are any network errors.
   *
   * @return {Promise<boolean>} True if the user is authenticated, false otherwise
   */
  async function verifyLogin() {
    let results = await checkUserAuthentication();
    return results.authenticated
  }

  /**
   * Retrieves authentication from local storage and verifies its validity
   *
   * Fetches the stored authentication object and validates it by making a request
   * to the server. If the authentication is invalid or expired, triggers logout.
   * Handles network errors and authentication failures appropriately.
   *
   * @return {Promise<Object|null>} The authentication object if found, null otherwise
   */
  const getAuth = async () => {
    const auth = await myAuthStore.getItem('authentication')

    if (auth) { // verify that auth is still valid
      try {
        const response = await doFetch(`${server}/api/v1/user`, auth, HTTP_GET_MAX_WAIT_TIME)
        const httpCode = response?.status || 0

        if (httpCode !== 200) {
          console.log(`getAuth() - error fetching user info, status code ${httpCode}`)

          if (unAuthenticated(httpCode)) {
            console.error(`getAuth() - user not authenticated, going to login`)
            await logout()
            return null
          } else {
            processError(null, httpCode)
          }
        }
      } catch (e) {
        if (e.toString().includes('401')) { // check if 401 code in exception
          console.error(`getAuth() - user token expired`)
          await logout()
          return null
        } else {
          // Network error — don't logout, just warn. Token may still be valid.
          console.warn(`getAuth() - hard error fetching user info, error=`, e)
        }
      }
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
      checkUserAuthentication,
      logout,
      setNetworkError,
      setServer,
      verifyLogin,
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

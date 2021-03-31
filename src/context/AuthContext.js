import React, { useState, createContext } from 'react'
import localforage from 'localforage'
import { AuthenticationContextProvider } from 'gitea-react-toolkit'
import { base_url, tokenid } from '@common/constants'

export const AuthContext = createContext({})

export default function AuthContextProvider(props) {
  const [authentication, setAuthentication] = useState(null)

  const myAuthStore = localforage.createInstance({
    driver: [localforage.INDEXEDDB],
    name: 'my-auth-store',
  })

  const getAuth = async () => {
    const auth = await myAuthStore.getItem('authentication')

    if (auth) { // verify that auth is still valid
      fetch('https://git.door43.org/api/v1/user', { ...auth.config })
        .then(response => {
          if (response?.status !== 200) {
            console.log(`TranslationSettings - error fetching user info, status code ${response?.status}`)

            if (response?.status === 401) {
              console.log(`TranslationSettings - user not authenticated, going to login`)
              logout()
            }
          }
        }).catch(e => {
          console.warn(`TranslationSettings - hard error fetching user info, error=`, e)
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
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
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
        {props.children}
      </AuthenticationContextProvider>
    </AuthContext.Provider>
  )
}

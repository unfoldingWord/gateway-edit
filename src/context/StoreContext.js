import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import useLocalStorage from '@hooks/useLocalStorage'
import { AuthenticationContext } from 'gitea-react-toolkit'
import { UserLocalStorage } from '@utils/UserLocalStorage'

const refreshUserSettingsList = {}

/**
 * will combine username and baseKey into unique settings key
 * @param username - string
 * @param baseKey - string
 * @return {string} key for user settings
 */
function getUserKey(username, baseKey) {
  const key_ = username ? `${username}_${baseKey}` : baseKey // get user key
  return key_
}

/**
 * set new value for user setting in both useState and localStorage if changes
 * @param key - string - base key that will be prepended with username
 * @param currentValue - current value for setting
 * @param setItem - callback function - called to update useState
 * @param newValue
 * @param username - string - user to save settings for
 */
function setUserItem(key, currentValue, setItem, newValue, username) {
  const key_ = getUserKey(username, key)
  // Allow value to be a function so we have same API as useState
  const valueToStore =
    newValue instanceof Function ? newValue(currentValue) : newValue
  const newValueStr = JSON.stringify(valueToStore)

  if (JSON.stringify(currentValue) !== newValueStr) {
    console.log(`setUserItem(${key_}) - saving new value ${newValueStr}`)
    localStorage.setItem(key_, newValueStr)
    setItem && setItem(valueToStore)
  }
}

/**
 * refresh saved value for user setting from localStorage if found, otherwise set to initialValue
 * @param key - string - base key that will be prepended with username
 * @param currentValue - current value for setting
 * @param setItem - callback function - called to update useState
 * @param initialValue - initial value to use if no setting found
 * @param username - string - user to save settings for
 * @return {any} returns current value
 */
function refreshUserItem(key, currentValue, setItem, initialValue, username) {
  const key_ = getUserKey(username, key)
  let savedValue = getUserItem(key_)

  if (savedValue === null) {
    savedValue = initialValue

    if (initialValue !== null) {
      localStorage.setItem(key_, JSON.stringify(initialValue)) // update with initial value
    }
  }

  setUserItem(key, currentValue, setItem, savedValue, username)
  return savedValue
}

/**
 * reads item from local storage
 * @param key - key for item
 * @return {any}
 */
function getUserItem(key) {
  let savedValue = localStorage.getItem(key)
  console.log(`getUserItem(${key}) - stored value ${savedValue}`)

  if (savedValue !== null) {
    try {
      savedValue = JSON.parse(savedValue)
    } catch {
      savedValue = null // if not parsable
    }
  }
  return savedValue
}

export const StoreContext = createContext({})

export default function StoreContextProvider(props) {
  const { state: authentication } = useContext(AuthenticationContext)
  const username = authentication?.user?.username || ''

  function useUserLocalStorage(key, initialValue, manage = true) {
    const [currentValue, setCurrentValue_] = useState(initialValue)
    const setCurrentValue = (newValue) => setUserItem(key, currentValue, setCurrentValue_, newValue, username)
    const refreshSettings = () => refreshUserItem(key, currentValue, setCurrentValue_, initialValue, username)

    // if true then setting will be automatically refreshed on user change, otherwise the app is responsible
    //   to directly call refreshSettings to read current settings from localStore
    if (manage) {
      refreshUserSettingsList[key] = refreshSettings
    }
    return [currentValue, setCurrentValue, refreshSettings]
  }

  const [owner, setOwner] = useUserLocalStorage('owner', '')
  const [languageId, setLanguageId] = useUserLocalStorage('languageId', '')
  const [showAccountSetup, setShowAccountSetup] = useLocalStorage(
    'showAccountSetup',
    true,
  )
  const userLocalStorage = useMemo(() => (new UserLocalStorage(username)), [username])
  const [taArticle, setTaArticle] = useState(null)
  const [selectedQuote, setQuote] = useLocalStorage('selectedQuote', null)
  // TODO blm: for now we use unfoldingWord for original language bibles
  const [scriptureOwner, setScriptureOwner] = useState('unfoldingWord')
  const [server, setServer] = useState('https://git.door43.org')
  const [branch, setBranch] = useState('master')
  const [bibleReference, setBibleReference] = useUserLocalStorage('bibleReference', {
    bookId: 'mat',
    chapter: '1',
    verse: '1',
  })

  const [supportedBibles, setSupportedBibles] = useLocalStorage('bibles', [])
  const [currentLayout, setCurrentLayout] = useUserLocalStorage('resourceLayout', null)

  useEffect(() => {
    if (username) { // when user has logged in or changed, refresh the user settings states from localStorage
      const keys = Object.keys(refreshUserSettingsList)

      for (const key of keys) { // update values for each useUserLocalStorage()
        const refresh = refreshUserSettingsList[key]
        refresh && refresh()
      }
    }
  }, [username])

  function onReferenceChange(bookId, chapter, verse) {
    setQuote(null)
    setBibleReference(prevState => ({
      ...prevState,
      bookId,
      chapter,
      verse,
    }))
  }

  function updateTaDetails(supportReference) {
    if (supportReference) {
      const path = supportReference?.replace('rc://*/ta/man/', '')
      const split = path.split('/')

      setTaArticle({
        projectId: split[0],
        filePath: `${split[1]}/01.md`,
      })
    } else {
      setTaArticle(null)
    }
  }

  const value = {
    state: {
      showAccountSetup,
      scriptureOwner,
      bibleReference,
      selectedQuote,
      languageId,
      taArticle,
      server,
      branch,
      owner,
      supportedBibles,
      currentLayout,
      useUserLocalStorage,
      userLocalStorage,
    },
    actions: {
      setShowAccountSetup,
      setScriptureOwner,
      onReferenceChange,
      updateTaDetails,
      setLanguageId,
      setBranch,
      setServer,
      setQuote,
      setOwner,
      setSupportedBibles,
      setCurrentLayout,
    },
  }

  return (
    <StoreContext.Provider value={value}>
      {props.children}
    </StoreContext.Provider>
  )
}

StoreContextProvider.propTypes = { children: PropTypes.object }

import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import useLocalStorage from '@hooks/useLocalStorage'
import { AuthenticationContext } from 'gitea-react-toolkit'

const refreshList = {}

function setUserItem(key, currentValue, setItem, newValue, username) {
  const key_ = username ? `${username}_${key}` : key // get user key
  // Allow value to be a function so we have same API as useState
  const valueToStore =
    newValue instanceof Function ? newValue(currentValue) : newValue
  const newValueStr = JSON.stringify(valueToStore);
  if (JSON.stringify(currentValue) !== newValueStr) {
    console.log(`setUserItem(${key_}) - saving new value ${newValueStr}`)
    localStorage.setItem(key_, newValueStr)
    setItem && setItem(valueToStore)
  }
}

function refreshUserItem(key, currentValue, setItem, initialValue, username) {
  const key_ = username ? `${username}_${key}` : key // get user key
  let savedValue = localStorage.getItem(key_)
  console.log(`getUserItem(${key_}) - stored value ${savedValue}`)

  if (savedValue === null) {
    savedValue = initialValue
    if (initialValue !== null) {
      localStorage.setItem(key_, JSON.stringify(initialValue)) // update with initial value
    }
  } else {
    savedValue = JSON.parse(savedValue)
  }
  setUserItem(key, currentValue, setItem, savedValue, username)
  return savedValue
}

export const StoreContext = createContext({})

export default function StoreContextProvider(props) {
  const { state: authentication } = useContext(AuthenticationContext)
  const username = authentication?.user?.username || ''

  function useLocalStorageUser(key,  initialValue) {
    const [currentValue, setCurrentValue_] = useState(initialValue)
    const setCurrentValue = (newValue) => setUserItem(key, currentValue, setCurrentValue_, newValue, username)
    refreshList[key] = () => refreshUserItem(key, currentValue, setCurrentValue, initialValue, username)
    return [currentValue, setCurrentValue]
  }

  const [owner, setOwner] = useLocalStorageUser('owner', '')
  const [languageId, setLanguageId] = useLocalStorageUser('languageId', '')
  const [showAccountSetup, setShowAccountSetup] = useLocalStorage(
    'showAccountSetup',
    true,
  )
  const [taArticle, setTaArticle] = useState(null)
  const [selectedQuote, setQuote] = useLocalStorage('selectedQuote', null)
  // TODO blm: for now we use unfoldingWord for original language bibles
  const [scriptureOwner, setScriptureOwner] = useState('unfoldingWord')
  const [server, setServer] = useState('https://git.door43.org')
  const [branch, setBranch] = useState('master')
  const [bibleReference, setBibleReference] = useLocalStorageUser('bibleReference', {
    bookId: 'mat',
    chapter: '1',
    verse: '1',
  })

  const [supportedBibles, setSupportedBibles] = useLocalStorage('bibles', [])
  const [currentLayout, setCurrentLayout] = useLocalStorageUser('resourceLayout', null)

  useEffect(() => {
    if (username) { // when user has changed, refresh the user settings states from localStorage
      const keys = Object.keys(refreshList)
      for (const key of keys) { // update values for each useLocalStorageUser()
        const refresh = refreshList[key]
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
      useLocalStorage: useLocalStorageUser
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

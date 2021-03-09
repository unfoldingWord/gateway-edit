import React, { useState, createContext } from 'react'
import PropTypes from 'prop-types'
import useLocalStorage from '@hooks/useLocalStorage'

export const StoreContext = createContext({})

export default function StoreContextProvider(props) {
  const [owner, setOwner] = useLocalStorage('owner', '')
  const [languageId, setLanguageId] = useLocalStorage('languageId', '')
  const [showAccountSetup, setShowAccountSetup] = useLocalStorage(
    'showAccountSetup',
    true,
  )
  const [taArticle, setTaArticle] = useState(null)
  const [selectedQuote, setQuote] = useLocalStorage('selectedQuote', null)
  // TODO blm: for testing use unfoldingWord since test_org does not have enough bibles
  const [scriptureOwner, setScriptureOwner] = useState('unfoldingWord')
  const [server, setServer] = useState('https://git.door43.org')
  const [branch, setBranch] = useState('master')
  const [bibleReference, setBibleReference] = useLocalStorage('bibleReference', {
    bookId: 'mat',
    chapter: '1',
    verse: '1',
  })

  const [supportedBibles, setSupportedBibles] = useLocalStorage('bibles', [])
  const [currentLayout, setCurrentLayout] = useLocalStorage('resourceLayout', null)

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

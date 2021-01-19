import React, { useState, createContext } from 'react'
import useLocalStorage from '@hooks/useLocalStorage'

export const ReferenceContext = createContext({})

export default function ReferenceContextProvider(props) {
  const [owner, setOwner] = useLocalStorage('owner', '')
  const [languageId, setLanguageId] = useLocalStorage('languageId', '')
  const [showAccountSetup, setShowAccountSetup] = useLocalStorage(
    'showAccountSetup',
    true
  )
  const [taArticle, setTaArticle] = useState(null)
  // TODO: To make the app more dynamic use the setters below to dynamically set and change the values
  const [server, setServer] = useState('https://git.door43.org')
  const [branch, setBranch] = useState('master')
  const [bibleReference, setBibleReference] = useState({
    bookId: 'mat',
    chapter: '1',
    verse: '1',
  })

  function onReferenceChange(bookId, chapter, verse) {
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
      bibleReference,
      languageId,
      taArticle,
      server,
      branch,
      owner,
    },
    actions: {
      setShowAccountSetup,
      onReferenceChange,
      updateTaDetails,
      setLanguageId,
      setBranch,
      setServer,
      setOwner,
    },
  }

  return (
    <ReferenceContext.Provider value={value}>
      {props.children}
    </ReferenceContext.Provider>
  )
}

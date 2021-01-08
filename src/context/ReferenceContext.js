import React, { useState, createContext } from 'react'

export const ReferenceContext = createContext({})

export default function ReferenceContextProvider(props) {
  // TODO: To make the app dynamic use the setters below to dynamically set and change the values
  const [languageId, setLanguageId] = useState('en')
  const [server, setServer] = useState('https://git.door43.org')
  const [owner, setOwner] = useState('test_org')
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

  const value = {
    state: {
      bibleReference,
      languageId,
      server,
      branch,
      owner,
    },
    actions: {
      onReferenceChange,
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

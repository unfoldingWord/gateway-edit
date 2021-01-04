import React, { useState, createContext } from 'react'

export const ReferenceContext = createContext({})

export default function ReferenceContextProvider(props) {
  const [languageID, setLanguageID] = useState('en')
  const [bibleReference, setBibleReference] = useState({
    bookId: 'mat',
    chapter: '1',
    verse: '1',
  })

  function onReferenceChange(bookId, chapter, verse) {
    console.info(`Reference: ${bookId} - ${chapter}:${verse}\n`)
    setBibleReference(prevState => ({
      ...prevState,
      bookId,
      chapter,
      verse,
    }))
  }

  const value = {
    state: {
      languageID,
      bibleReference,
    },
    actions: {
      setLanguageID,
      onReferenceChange,
    },
  }

  return (
    <ReferenceContext.Provider value={value}>
      {props.children}
    </ReferenceContext.Provider>
  )
}

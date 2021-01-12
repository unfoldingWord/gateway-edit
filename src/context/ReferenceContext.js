import React, { useState, createContext } from 'react'

export const ReferenceContext = createContext({})

export default function ReferenceContextProvider(props) {
  // TODO: To make the app dynamic use the setters below to dynamically set and change the values
  const [languageId, setLanguageId] = useState('en')
  const [server, setServer] = useState('https://git.door43.org')
  const [owner, setOwner] = useState('test_org')
  const [branch, setBranch] = useState('master')
  const [taArticle, setTaArticle] = useState(null)
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
      bibleReference,
      languageId,
      taArticle,
      server,
      branch,
      owner,
    },
    actions: {
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

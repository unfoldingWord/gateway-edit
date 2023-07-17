import React, {
  createContext,
  useContext,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import useLocalStorage from '@hooks/useLocalStorage'
import * as useULS from '@hooks/useUserLocalStorage'
import { AuthContext } from '@context/AuthContext'
import useSaveChangesPrompt from '@hooks/useSaveChangesPrompt'

export const StoreContext = createContext({})

export default function StoreContextProvider(props) {
  const {
    state: {
      authentication,
      defaultServer,
      networkError: tokenNetworkError,
      server,
    },
    actions: {
      logout,
      setNetworkError: setTokenNetworkError,
      setServer,
    },
  } = useContext(AuthContext)
  const username = authentication?.user?.username || ''

  /**
   * wrapper for useULS.useUserLocalStorage that applies current username
   * @param {string} key
   * @param {any} initialValue
   * @return {any[]}
   */
  function useUserLocalStorage(key, initialValue) {
    return useULS.useUserLocalStorage(username, key, initialValue)
  }

  const [mainScreenRef, setMainScreenRef] = useState(null)
  const [lastError, setLastError] = useState(null)
  const [owner, setOwner] = useUserLocalStorage('owner', '')
  const [languageId, setLanguageId] = useUserLocalStorage('languageId', '')
  const [showAccountSetup, setShowAccountSetup] = useLocalStorage(
    'showAccountSetup',
    true,
  )
  const [taArticle, setTaArticle] = useState(null)
  const [selectedQuote, setQuote] = useUserLocalStorage('selectedQuote', null)
  // TODO blm: for now we use unfoldingWord for original language bibles
  const [scriptureOwner, setScriptureOwner] = useState('unfoldingWord')
  const [appRef, setAppRef] = useUserLocalStorage('appRef', 'master') // default for app
  const [bibleReference, setBibleReference] = useUserLocalStorage('bibleReference', {
    bookId: 'mat',
    chapter: '1',
    verse: '1',
  })

  const [greekRepoUrl, setGreekRepoUrl] = useLocalStorage('greekRepoUrl', null)
  const [hebrewRepoUrl, setHebrewRepoUrl] = useLocalStorage('hebrewRepoUrl', null)
  const [supportedBibles, setSupportedBibles] = useLocalStorage('bibles', [])
  const [currentLayout, setCurrentLayout] = useUserLocalStorage('resourceLayout', null)
  const [filter, _setFilter] = useState({
    enabled: false,
    filename: null,
    filteredBooks: null,
    config: null,
    rawTSV: null,
  })
  const [mergeStatusForCards, setMergeStatusForCards] = useState({})
  const [cardsSaving, setCardsSaving] = useState([])
  const [cardsLoadingUpdate, setCardsLoadingUpdate] = useState([])
  const [cardsLoadingMerge, setCardsLoadingMerge] = useState([])

  function updateMergeState(cardId, mergeFromMaster, mergeToMaster, mergeFromMasterIntoUserBranch, mergeToMasterFromUserBranch) {
    console.log('updateMergeState',{cardId, mergeFromMaster, mergeToMaster})
    const newMergeStatus = {
      ...mergeStatusForCards,
      [cardId]: {
        mergeFromMaster,
        mergeToMaster,
        mergeFromMasterIntoUserBranch,
        mergeToMasterFromUserBranch,
      },
    }
    setMergeStatusForCards(newMergeStatus)
  }

  function getMergeFromMasterStatus(_mergeStatusForCards = mergeStatusForCards) {
    const cardIds = Object.keys(_mergeStatusForCards)
    let mergeConflict = false
    let mergeNeeded = false
    let foundMergeStatusCard = false

    for (const cardId of cardIds) {
      const { mergeFromMaster } = _mergeStatusForCards[cardId]

      if (mergeFromMaster && !mergeFromMaster.error) {
        foundMergeStatusCard = true

        if (mergeFromMaster.mergeNeeded) {
          mergeNeeded = true
        }

        if (mergeFromMaster.conflict) {
          mergeConflict = true
        }
      }
    }
    return {
      mergeConflict,
      mergeNeeded,
      foundMergeStatusCard,
    }
  }

  function callMergeFromMasterForCards(_mergeStatusForCards = mergeStatusForCards){
    const cardIds = Object.keys(_mergeStatusForCards)

    for (const cardId of cardIds){
      const { mergeFromMasterIntoUserBranch } = _mergeStatusForCards[cardId]
      mergeFromMasterIntoUserBranch && mergeFromMasterIntoUserBranch()
    }
  }

  const {
    savedChanges,
    setSavedChanges,
    checkUnsavedChanges,
    showSaveChangesPrompt,
  } = useSaveChangesPrompt()

  function setFilter(config) {
    const newConfig = {
      ...filter,
      ...config,
    }
    _setFilter(newConfig)
  }

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
    if (typeof supportReference === 'string') {
      const path = supportReference?.replace('rc://*/ta/man/', '')
      const split = path.split('/')

      setTaArticle({
        projectId: split.length > 1 ? split[0] : 'translate',
        filePath: `${split[1] || split[0]}/01.md`,
      })
    } else {
      setTaArticle(null)
    }
  }

  const value = {
    state: {
      appRef,
      authentication,
      bibleReference,
      cardsSaving,
      cardsLoadingUpdate,
      cardsLoadingMerge,
      currentLayout,
      defaultServer,
      filter,
      greekRepoUrl,
      hebrewRepoUrl,
      languageId,
      lastError,
      loggedInUser: username,
      mainScreenRef,
      mergeStatusForCards,
      owner,
      savedChanges,
      scriptureOwner,
      selectedQuote,
      server,
      showAccountSetup,
      supportedBibles,
      taArticle,
      tokenNetworkError,
      useUserLocalStorage,
    },
    actions: {
      callMergeFromMasterForCards,
      checkUnsavedChanges,
      getMergeFromMasterStatus,
      logout,
      onReferenceChange,
      setAppRef,
      setCardsSaving,
      setCardsLoadingUpdate,
      setCardsLoadingMerge,
      setCurrentLayout,
      setFilter,
      setGreekRepoUrl,
      setHebrewRepoUrl,
      setLanguageId,
      setLastError,
      setMainScreenRef,
      setOwner,
      setQuote,
      setSavedChanges,
      setShowAccountSetup,
      setScriptureOwner,
      setServer,
      setSupportedBibles,
      setTokenNetworkError,
      showSaveChangesPrompt,
      updateMergeState,
      updateTaDetails,
    },
  }

  return (
    <StoreContext.Provider value={value}>
      {props.children}
    </StoreContext.Provider>
  )
}

StoreContextProvider.propTypes = { children: PropTypes.object }

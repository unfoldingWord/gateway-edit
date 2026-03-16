import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import useLocalStorage from '@hooks/useLocalStorage'
import * as useULS from '@hooks/useUserLocalStorage'
import { AuthContext } from '@context/AuthContext'
import useSaveChangesPrompt from '@hooks/useSaveChangesPrompt'

export const StoreContext = createContext({})

function testForMergeError(mergeStatus) {
  return mergeStatus.error && !/branch .* does not exist/.test(mergeStatus.message);
}

export default function StoreContextProvider(props) {
  /*
    The mergeStatusForCards state contains the merge status to and from the main branch
    for each resource and scripture card. This is used in `useMergeCardsProps` and
    `useUpdateCardsProps` so that we can tell the user which cards are needing merge,
    having conflicts, etc. This state is also used to call an app-wide merge to/from main
    branch when the user clicks on the update button in the app header and the merge my work
    button in the hamburger menu.
  */
  const [mergeStatusForCards, setMergeStatusForCards] = useState({})
  function updateMergeState(
    cardId,
    title,
    mergeFromMaster,
    mergeToMaster,
    mergeFromMasterIntoUserBranch,
    mergeToMasterFromUserBranch
  ) {
    console.log('updateMergeState', { cardId, mergeFromMaster, mergeToMaster })
    const mergeFromMasterError = testForMergeError(mergeFromMaster)
    const mergeToMasterError = testForMergeError(mergeToMaster)
    const mergeError = mergeToMasterError || mergeFromMasterError;
    if (mergeError) {
      console.error('updateMergeState - merge error', {mergeFromMaster, mergeToMaster})
    }
    setMergeStatusForCards(oldMergeStatusForCards => ({
      ...oldMergeStatusForCards,
      [cardId]: {
        title,
        mergeFromMaster,
        mergeToMaster,
        mergeFromMasterIntoUserBranch,
        mergeToMasterFromUserBranch,
      },
    }))
  }

  const {
    state: {
      authentication,
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
  // this is initially set to off for general users, but to enable for development set flag (<user>_enableObs) to true in local storage
  const [enableObsSupport, setEnableObsSupport] = useUserLocalStorage(
    'enableObs',
    false,
  )
  const [obsSupport, setObsSupport] = useState(enableObsSupport) // default to enable state until actual determination is made
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
  const [cardsSaving, setCardsSaving] = useState([])
  const [cardsLoadingUpdate, setCardsLoadingUpdate] = useState([])
  const [cardsLoadingMerge, setCardsLoadingMerge] = useState([])
  const mergeCheckRef = useRef(0)
  const [mergeCheck, setMergeCheck] = useState(0)
  const [authError, setAuthError] = useState(0)
  const transtateRef = useRef(null)

  function translate(key, options) {
    if (transtateRef.current) {
      return transtateRef.current(key, options)
    }
    return `translate not set, key: ${key}`
  }

  function setTranslate(translateFunc) {
    transtateRef.current = translateFunc
  }

  function updateMergeCheck() {
    mergeCheckRef.current += 1
    setMergeCheck(mergeCheckRef.current)
  }

  const {
    savedChanges,
    setSavedChanges,
    checkUnsavedChanges,
    showSaveChangesPrompt,
  } = useSaveChangesPrompt()

  useEffect(() => {
    // when enableObsSupport changes state (likely from reading from local storage),
    //    then set the default value for OBS
    if (enableObsSupport !== obsSupport) {
      setObsSupport(enableObsSupport)
    }
  }, [enableObsSupport])

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
      authError,
      authentication,
      bibleReference,
      cardsLoadingUpdate,
      cardsLoadingMerge,
      cardsSaving,
      currentLayout,
      enableObsSupport,
      greekRepoUrl,
      hebrewRepoUrl,
      languageId,
      lastError,
      loggedInUser: username,
      mainScreenRef,
      mergeCheck,
      mergeStatusForCards,
      obsSupport,
      owner,
      savedChanges,
      scriptureOwner,
      selectedQuote,
      server,
      showAccountSetup,
      supportedBibles,
      taArticle,
      tokenNetworkError,
      translate,
      useUserLocalStorage,
    },
    actions: {
      checkUnsavedChanges,
      logout,
      onReferenceChange,
      setAppRef,
      setAuthError,
      setCardsLoadingMerge,
      setCardsLoadingUpdate,
      setCardsSaving,
      setCurrentLayout,
      setGreekRepoUrl,
      setHebrewRepoUrl,
      setMainScreenRef,
      setShowAccountSetup,
      setScriptureOwner,
      setLanguageId,
      setLastError,
      setObsSupport,
      setOwner,
      setQuote,
      setSavedChanges,
      showSaveChangesPrompt,
      setServer,
      setSupportedBibles,
      setTokenNetworkError,
      setTranslate,
      updateMergeCheck,
      updateTaDetails,
      updateMergeState,
    },
  }

  return (
    <StoreContext.Provider value={value}>
      {props.children}
    </StoreContext.Provider>
  )
}

StoreContextProvider.propTypes = { children: PropTypes.object }

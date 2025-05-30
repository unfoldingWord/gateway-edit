import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react'
import isEqual from 'deep-equal'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useSnackbar } from 'notistack'
import {
  MinimizedCardsListUI,
  useMinimizedCardsState,
  Workspace,
} from 'resource-workspace-rcl'
import { makeStyles } from '@material-ui/core/styles'
import {
  fixOccurrence,
  getVersesForRef,
  NT_ORIG_LANG,
  NT_ORIG_LANG_BIBLE,
  ORIGINAL_SOURCE,
  OT_ORIG_LANG,
  OT_ORIG_LANG_BIBLE,
  ScriptureCard,
  splitUrl,
  TARGET_LITERAL,
  TARGET_SIMPLIFIED,
  useScripture,
} from 'single-scripture-rcl'
import { DraggableCard, useResourceClickListener } from 'translation-helps-rcl'
import ResourceCard from '@components/ResourceCard'
import {
  getLatestBibleRepo,
  getResourceBibles,
} from '@utils/resources'
import { StoreContext } from '@context/StoreContext'
import { isNT, BIBLES_ABBRV_INDEX } from '@common/BooksOfTheBible'
import { getLanguage } from '@common/languages'
import CircularProgress from '@components/CircularProgress'
import {
  addNetworkDisconnectError,
  onNetworkActionButton,
  processNetworkError,
  reloadApp,
} from '@utils/network'
import { HTTP_CONFIG } from '@common/constants'
import NetworkErrorPopup from '@components/NetworkErrorPopUp'
import WordAlignerDialog from '@components/WordAlignerDialog'
import useLexicon from '@hooks/useLexicon'
import useWindowDimensions from '@hooks/useWindowDimensions'
import { translate } from '@utils/lexiconHelpers'
import { getBuildId } from '@utils/build'

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    margin: '0 1px !important',
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
  },
  dragIndicator: {},
}))
const wordAlignmentScreenRatio = 0.7
const wordAlignmentMaxHeightPx = 1000

const buildId = getBuildId()
console.log(`Gateway Edit App Version`, buildId)

const OFFLINE_TIMEOUT = 5000; // Move timeout constant outside component

// Move these handlers outside the component
const handleError = (event) => {
  console.warn(`[WorkspaceContainer] Error:`, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack,
  })
}

const handleOnline = () => {
  console.warn('[WorkspaceContainer] Online')
}

function WorkspaceContainer() {
  const router = useRouter()
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()
  const [state, _setState] = useState({
    currentVerseReference: null,
    originalScriptureBookObjects: null,
    networkError: null,
    scriptureReference: {},
    wordAlignerStatus: null,
    workspaceReady: false,
  })

  const {
    currentVerseReference,
    networkError,
    originalScriptureBookObjects,
    scriptureReference,
    wordAlignerStatus,
    workspaceReady,
  } = state

  function setState(newState) {
    _setState(prevState => ({ ...prevState, ...newState }))
  }

  const { height } = useWindowDimensions()

  const wordAlignerHeight = useMemo(() => {
    let _height = wordAlignmentScreenRatio * height

    if (_height > wordAlignmentMaxHeightPx) {
      _height = wordAlignmentMaxHeightPx
    }

    return _height
  }, [height])

  const {
    state: {
      owner,
      server,
      appRef,
      taArticle,
      languageId,
      selectedQuote,
      scriptureOwner,
      bibleReference: {
        bookId, chapter, verse,
      },
      supportedBibles,
      currentLayout,
      useUserLocalStorage,
      loggedInUser,
      authentication,
      tokenNetworkError,
      greekRepoUrl,
      hebrewRepoUrl,
      mainScreenRef,
      enableObsSupport,
    },
    actions: {
      logout,
      setQuote: _setQuote,
      setSupportedBibles,
      setCurrentLayout,
      setTokenNetworkError,
      setLastError,
      showSaveChangesPrompt,
      setCardsLoadingUpdate,
      setCardsLoadingMerge,
      setCardsSaving,
      setGreekRepoUrl,
      setHebrewRepoUrl,
      setSavedChanges,
      updateMergeState,
      updateTaDetails,
      setObsSupport,
    },
  } = useContext(StoreContext)

  const [
    {
      loading, title, content, error,
    },
    clearContent,
  ] = useResourceClickListener({
    owner,
    server,
    ref: appRef,
    taArticle,
    languageId,
    onResourceError,
    httpConfig: HTTP_CONFIG,
  })

  const { actions: { fetchGlossesForVerse, getLexiconData } } = useLexicon({
    bookId,
    languageId,
    server,
  })

  /**
   * clean up quote before applying
   * @param {object} newQuote
   */
  function setCurrentCheck(newQuote) {
    console.log('newQuote', newQuote)
    let _quote = newQuote ? {
      ...newQuote,
      occurrence: fixOccurrence(newQuote.occurrence),
    } : {}

    if (newQuote && !newQuote.reference) {
      _quote.reference= `${chapter}:${verse}`
    }

    if (!isEqual(selectedQuote, _quote)) {
      _setQuote(_quote)
    }

    if (_quote && !isEqual(_quote.reference, currentVerseReference)){
      setState( { currentVerseReference: _quote.reference })
    }
  }

  /**
   * update word aligner status
   * @param newWordAlignmentStatus
   */
  function setWordAlignerStatus(newWordAlignmentStatus) {
    if (!isEqual(wordAlignerStatus, newWordAlignmentStatus)) {
      setState({ wordAlignerStatus: newWordAlignmentStatus })
    }
  }

  useEffect(()=>{
    // console.log('on reference change:', { chapter, verse, bookId, currentVerseReference })
    const reference = {
      chapter,
      verse,
      bookId,
      projectId: bookId,
    }

    if (currentVerseReference){
      const index = currentVerseReference.indexOf(':')

      if (index >= 0){
        const chapter = currentVerseReference.substring(0,index)
        const verse = currentVerseReference.substring(index + 1)
        reference.chapter = chapter
        reference.verse = verse
      }
    }

    if (!isEqual(reference, scriptureReference)){
      setState({ scriptureReference: reference })
    }
  },[chapter, verse, bookId, currentVerseReference])

  /**
   * in the case of a network error, process and display error dialog
   * @param {string} errorMessage - optional error message returned
   * @param {number} httpCode - http code returned
   */
  function processError(errorMessage, httpCode=0) {
    processNetworkError(errorMessage, httpCode, logout, router, setNetworkError, setLastError )
  }

  const setNetworkError = useCallback(( error ) => {
    setState( { networkError: error })
  }, [])

  /**
   * show either tokenNetworkError or NetworkError for workspace
   * @return {JSX.Element|null}
   */
  function showNetworkError() {
    if (tokenNetworkError) { // if we had a token network error on startup
      if (!tokenNetworkError.router) { // needed for reload of page
        setTokenNetworkError({ ...tokenNetworkError, router }) // make sure router is set
      }
      return (
        <NetworkErrorPopup
          networkError={tokenNetworkError}
          setNetworkError={(error) => {
            setTokenNetworkError(error)
            setNetworkError(null) // clear this flag in case it was also set
          }}
          hideClose={true}
          onRetry={reloadApp}
        />
      )
    } else if (networkError) { // for all other workspace network errors
      return (
        <NetworkErrorPopup
          networkError={networkError}
          setNetworkError={setNetworkError}
          onActionButton={onNetworkActionButton}
          hideClose={false}
          /* show reload if send feedback not enabled */
          onRetry={!networkError.actionButtonText ? reloadApp : null}
        />
      )
    }
    return null
  }

  const [offlineTimer, setOfflineTimer] = useState(null);

  // Use useCallback for the offline handler since it needs access to component state
  const handleOffline = useCallback(() => {
    console.warn('[WorkspaceContainer] Offline');

    // Clear any existing timer first
    if (offlineTimer) {
      clearTimeout(offlineTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      // Pass required parameters to processNetworkError
      processNetworkError(
        'Network connection lost',
        0,
        logout,
        router,
        setNetworkError,
        setLastError
      );
    }, OFFLINE_TIMEOUT);

    setOfflineTimer(timer);
  }, [offlineTimer, logout, router, setNetworkError, setLastError]);

  // Update the online handler to use notistack
  const handleOnlineWithCleanup = useCallback(() => {
    handleOnline();

    if (offlineTimer) {
      clearTimeout(offlineTimer);
      setOfflineTimer(null);
    }

    enqueueSnackbar('Connection restored', {
      variant: 'success',
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      }
    });
  }, [offlineTimer, enqueueSnackbar]);

  // Effect for event listeners
  useEffect(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnlineWithCleanup);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnlineWithCleanup);

      if (offlineTimer) {
        clearTimeout(offlineTimer);
      }
    };
  }, [handleOffline, handleOnlineWithCleanup, offlineTimer]);

  /**
   * process error and determine if there is a problem with connection to server
   *  if showAnyError is true we display an error popup
   *    the process then is to check if this is server connection problem - if so we display that message, if not we display the error returned
   *  if showAnyError is false (default) we only display an error popup if there is a problem connecting to server
   * @param {string} message - the error message we received fetching a resource
   * @param {boolean} isAccessError - if false then the error type is not one that would be caused by server connection problems
   * @param {number} resourceStatus - status code returned fetching resource
   * @param {object} error - error object for detected error, could be a parsing error, etc.  This will take precedence over message
   * @param {boolean} showAllErrors - if true then always show a popup error message, otherwise just show server error message if we can't talk to server
   */
  function onResourceError(message, isAccessError, resourceStatus, error, showAllErrors = false) {
    if (!networkError ) { // only show if another error not already showing
      if (showAllErrors) {
        console.warn(`[WorkspaceContainer] Errors found:`, { message, isAccessError, resourceStatus, error, showAllErrors })

        processNetworkError(error || message, resourceStatus, logout, router, setNetworkError, setLastError);
      } else {
        console.warn(`[WorkspaceContainer] Errors found:`, { message, isAccessError, resourceStatus, error, showAllErrors })

        if (isAccessError) { // we only show popup for access errors
          addNetworkDisconnectError(error || message, 0, logout, router, setNetworkError, setLastError)
        }
      }
    } else {
      console.warn(`[WorkspaceContainer] Network Error:`, {
        networkError: JSON.parse(JSON.stringify(networkError)),
        message,
        isAccessError,
        resourceStatus,
        error,
        showAllErrors,
      })
    }
  }

  useEffect(() => { // on verse navigation, clear verse spans and selections
    // clear current verse reference and alignments
    setState( { currentVerseReference: null, wordAlignerStatus: null })
  }, [chapter, verse, bookId])

  const commonScriptureCardConfigs = {
    appRef,
    authentication,
    bookIndex: BIBLES_ABBRV_INDEX[bookId],
    classes,
    getLanguage,
    getLexiconData,
    greekRepoUrl,
    hebrewRepoUrl,
    httpConfig: HTTP_CONFIG,
    isNT,
    loggedInUser,
    onResourceError,
    originalLanguageOwner: scriptureOwner,
    originalScriptureBookObjects,
    reference: scriptureReference,
    selectedQuote,
    server,
    setCardsLoadingUpdate,
    setCardsLoadingMerge,
    setCardsSaving,
    setSavedChanges,
    setWordAlignerStatus,
    translate,
    updateMergeState,
    useUserLocalStorage,
  }

  const commonResourceCardConfigs = {
    appRef,
    authentication,
    classes,
    chapter,
    languageId,
    loggedInUser,
    onResourceError,
    owner,
    server,
    verse,
    useUserLocalStorage,
  }

  useEffect(() => {
    setState( { workspaceReady: false })
    setObsSupport(enableObsSupport) // default to enableObsSupport

    /**
     * check for presence of valid OBS repo
     */
    function checkForObsRepo() {
      getResourceBibles({ // fetch OBS resource for GL
        bookId,
        chapter,
        verse,
        resourceId: 'obs',
        owner,
        languageId,
        ref: appRef,
        server,
      }).then(results => {
        const { bibles: projects, resourceLink, httpCode } = results
        let foundObs = false

        if (httpCode) {
          console.warn(`OBS not valid - got invalid http code ${httpCode} ${resourceLink}`)
        } else if (projects?.length > 0) {
          console.log(`found OBS for ${resourceLink}`)
          foundObs = true
        } else {
          console.warn(`OBS not valid - no projects for ${resourceLink}`)
        }
        setObsSupport(foundObs)
      }).catch((e) => {
        console.log(`could not fetch OBS translation for  ${{languageId, owner, server}}`)
        setObsSupport(false)
      })
    }

    if (owner && languageId && appRef && server && loggedInUser) {
      enableObsSupport && checkForObsRepo() // if OBS is enabled, check for OBS repo

      /**
       * open the literal bible for current GL to find out which books have content
       */
      getResourceBibles({
        bookId,
        chapter,
        verse,
        // for en GL, we use the ULT translation, other GLs use the GLT
        resourceId: languageId === 'en' ? 'ult' : 'glt',
        owner,
        languageId,
        ref: appRef,
        server,
      }).then(results => {
        const { bibles, resourceLink } = results

        if (bibles?.length) {
          if (!isEqual(bibles, supportedBibles)) {
            console.log(`found ${bibles?.length} bibles`)
            setSupportedBibles(bibles) // TODO blm: update bible refs
          }
        } else {
          console.warn(`no bibles found for ${resourceLink}`)
        }
        setState( { workspaceReady: true })
      }).catch((e) => {
        setState( { workspaceReady: true })
        console.error(`could not fetch literal translation for  ${{languageId, owner, server}}`)
        processError(e.toString())
      })
    }// eslint-disable-next-line
  }, [owner, languageId, appRef, server, loggedInUser])

  useEffect(() => {
    const missingOrignalBibles = !hebrewRepoUrl || !greekRepoUrl

    if (missingOrignalBibles) { // if we don't have a path
      setState( { workspaceReady: false })
      console.log(`WorkspaceContainer - waiting on latest original bible repos`)
    }

    const hebrewPromise = getLatestBibleRepo(server, 'unfoldingWord', 'hbo', 'uhb', processError)
    const greekPromise = getLatestBibleRepo(server, 'unfoldingWord', 'el-x-koine', 'ugnt', processError)

    Promise.all([hebrewPromise, greekPromise]).then( (results) => {
      const [repoHebrew, repoGreek] = results
      let changed = false

      if (repoHebrew && (repoHebrew !== hebrewRepoUrl)) {
        setHebrewRepoUrl(repoHebrew)
        changed = true
      }

      if (repoGreek && (repoGreek !== greekRepoUrl)) {
        setGreekRepoUrl(repoGreek)
        changed = true
      }

      if (missingOrignalBibles && repoHebrew && repoGreek) {
        console.log(`WorkspaceContainer - found original bible repos`)
        setState( { workspaceReady: true })
      } else if (changed) { // force redraw
        console.log(`WorkspaceContainer - original bible repos changed, force reload`)
        setState( { workspaceReady: false })
        setTimeout(() => {
          setState( { workspaceReady: true })
        }, 500)
      }
    })
  }, [])

  const firstCard = (bookId === 'obs') ?
    // if doing OBS, show OBS resource card in place of first scripture card
    {
      title: 'Open Bible Story',
      type: 'resource_card',
      id: 'resource_card_obs',
      resourceId: 'obs',
      projectId: bookId,
      filePath: null,
      loggedInUser: loggedInUser,
      authentication: authentication,
      ...commonResourceCardConfigs,
    }
    :
    // if not doing OBS, show regular first scripture card
    {
      title: 'Literal Translation',
      type: 'scripture_card',
      id: 'scripture_card_0',
      cardNum: 0,
      resource: {
        owner,
        languageId,
        resourceId: TARGET_LITERAL,
        originalLanguageOwner: scriptureOwner,
      },
      ...commonScriptureCardConfigs,
    }

  const cards = [
    firstCard,
    {
      title: 'Original Source',
      type: 'scripture_card',
      id: 'scripture_card_1',
      cardNum: 1,
      resource: {
        owner,
        languageId,
        resourceId: ORIGINAL_SOURCE,
        originalLanguageOwner: scriptureOwner,
      },
      ...commonScriptureCardConfigs,
    },
    {
      title: 'Simplified Translation',
      type: 'scripture_card',
      id: 'scripture_card_2',
      cardNum: 2,
      resource: {
        owner,
        languageId,
        resourceId: TARGET_SIMPLIFIED,
        originalLanguageOwner: scriptureOwner,
      },
      ...commonScriptureCardConfigs,
    },
    {
      title: 'translationNotes',
      type: 'resource_card',
      id: 'resource_card_tn',
      filePath: null,
      resourceId: 'tn',
      projectId: bookId,
      setCurrentCheck: setCurrentCheck,
      selectedQuote: selectedQuote,
      updateTaDetails: updateTaDetails,
      loggedInUser: loggedInUser,
      authentication: authentication,
      setSavedChanges: setSavedChanges,
      showSaveChangesPrompt: showSaveChangesPrompt,
      ...commonResourceCardConfigs,
    },
    {
      title: 'translationAcademy',
      type: 'resource_card',
      id: 'resource_card_ta',
      resourceId: 'ta',
      projectId: taArticle?.projectId ?? bookId,
      filePath: taArticle?.filePath,
      errorMessage: taArticle ? null : 'No article is specified in the current note.',
      loggedInUser: loggedInUser,
      authentication: authentication,
      setSavedChanges: setSavedChanges,
      showSaveChangesPrompt: showSaveChangesPrompt,
      ...commonResourceCardConfigs,
    },
    {
      title: 'translationWords List',
      type: 'resource_card',
      id: 'resource_card_twl',
      viewMode: 'list',
      resourceId: 'twl',
      projectId: bookId,
      filePath: null,
      setCurrentCheck: setCurrentCheck,
      selectedQuote: selectedQuote,
      disableFilters: true,
      disableNavigation: true,
      hideMarkdownToggle: true,
      loggedInUser: loggedInUser,
      authentication: authentication,
      setSavedChanges: setSavedChanges,
      showSaveChangesPrompt: showSaveChangesPrompt,
      ...commonResourceCardConfigs,
    },
    {
      title: 'translationWords Article',
      type: 'resource_card',
      id: 'resource_card_twa',
      viewMode: 'markdown',
      resourceId: 'twl',
      projectId: bookId,
      filePath: null,
      setCurrentCheck: setCurrentCheck,
      selectedQuote: selectedQuote,
      disableFilters: true,
      loggedInUser: loggedInUser,
      authentication: authentication,
      setSavedChanges: setSavedChanges,
      showSaveChangesPrompt: showSaveChangesPrompt,
      ...commonResourceCardConfigs,
    },
    {
      title: 'translationQuestions',
      type: 'resource_card',
      id: 'resource_card_tq',
      resourceId: 'tq',
      projectId: bookId,
      filePath: null,
      viewMode: 'question',
      disableFilters: true,
      loggedInUser: loggedInUser,
      authentication: authentication,
      setSavedChanges: setSavedChanges,
      showSaveChangesPrompt: showSaveChangesPrompt,
      ...commonResourceCardConfigs,
    },
  ]

  const {
    visibleCards, minimizedCards, maximizeCard,
  } = useMinimizedCardsState({
    cards, setCurrentLayout, currentLayout, useUserLocalStorage,
  })

  const isNewTestament = isNT(bookId)
  const originalLanguageId = isNewTestament ? NT_ORIG_LANG : OT_ORIG_LANG
  const originalScripture = {
    reference: {
      bookId,
      chapter,
      verse,
    },
    isNT: () => isNT(bookId),
    resource: {
      owner: 'unfoldingWord',
      originalLanguageOwner: 'unfoldingWord',
      languageId: originalLanguageId,
      resourceId: ORIGINAL_SOURCE,
    },
    getLanguage: () => ({ direction: isNewTestament ? 'ltr' : 'rtl' }),
  }

  const config = {
    server,
    ...HTTP_CONFIG,
  }

  const { resourceLink: origResourceLink } = useMemo(() => splitUrl(isNewTestament ? greekRepoUrl : hebrewRepoUrl), [isNewTestament, greekRepoUrl, hebrewRepoUrl])

  const originalScriptureResults = useScripture({
    ...originalScripture,
    config,
    readyForFetch: !!bookId && !!server,
    resource: {
      ...originalScripture.resource,
      resourceId: isNewTestament ? NT_ORIG_LANG_BIBLE : OT_ORIG_LANG_BIBLE,
      projectId: isNewTestament ? NT_ORIG_LANG_BIBLE : OT_ORIG_LANG_BIBLE,
      ref: appRef,
    },
    resourceLink: origResourceLink,
    wholeBook: true,
  })

  useEffect(() => {
    let originalScriptureBookObjects = null

    if (originalScriptureResults?.bookObjects) {
      originalScriptureBookObjects = {
        ...originalScriptureResults?.bookObjects,
        bookId,
        languageId: originalLanguageId,
      }
    }

    setState( { originalScriptureBookObjects })
  }, [originalScriptureResults?.bookObjects])

  useEffect(() => { // pre-cache glosses on verse change
    const fetchGlossDataForVerse = async () => {
      const verses = getVersesForRef(scriptureReference, originalScriptureBookObjects, originalLanguageId)

      if (verses?.length) {
        for (const verseReference of verses) {
          const origVerseObjects = verseReference?.verseData?.verseObjects

          if (origVerseObjects) {
            // eslint-disable-next-line no-await-in-loop
            await fetchGlossesForVerse(origVerseObjects, originalLanguageId)
          }
        }
      }
    }

    if (originalScriptureBookObjects && scriptureReference?.projectId) {
      fetchGlossDataForVerse()
    }
  }, [scriptureReference, originalScriptureBookObjects, originalLanguageId ])

  return (
    (!workspaceReady) ? // Do not render workspace until user logged in and we have user settings
      <>
        {showNetworkError()}
        <CircularProgress size={180} />
      </>
      :
      <>
        <MinimizedCardsListUI minimizedCards={minimizedCards} maximizeCard={maximizeCard}/>
        {loading || content || error ?
          <DraggableCard
            open
            error={error}
            title={title}
            loading={loading}
            content={content}
            onClose={() => clearContent()}
            workspaceRef={mainScreenRef}
          />
          :
          null
        }
        <Workspace
          rowHeight={25}
          layout={currentLayout}
          classes={classes}
          gridMargin={[10, 10]}
          onLayoutChange={(_layout, layouts) => {
            setCurrentLayout(layouts)
          }}
          layoutWidths={[
            [1, 1, 1],
            [2, 2],
            [1, 1.5, 1.5],
          ]}
          layoutHeights={[[5], [10, 10], [10, 10]]}
          minW={3}
          minH={4}
          breakpoints={{
            lg: 900,
            sm: 680,
            xs: 300,
          }}
          columns={{
            lg: 12,
            sm: 6,
            xs: 3,
          }}
        >
          {
            _.map(visibleCards, (cardProps, i) =>
              cardProps.type === 'scripture_card' ?
                <ScriptureCard key={cardProps.title} {...cardProps} />
                :
                <ResourceCard key={cardProps.title} {...cardProps} />,
            )
          }
        </Workspace>
        <WordAlignerDialog
          alignerStatus={wordAlignerStatus}
          height={wordAlignerHeight}
          translate={translate}
          getLexiconData={getLexiconData}
        />

        {(tokenNetworkError || networkError) && // Do not render workspace until user logged in and we have user settings
          <>
            {showNetworkError()}
          </>
        }
      </>
    )
  }

export default WorkspaceContainer

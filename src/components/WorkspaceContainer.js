import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as isEqual from 'deep-equal'
import { Workspace } from 'resource-workspace-rcl'
import { makeStyles } from '@material-ui/core/styles'
import { SelectionsContextProvider } from 'scripture-resources-rcl'
import {
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
import { isNT } from '@common/BooksOfTheBible'
import { getLanguage } from '@common/languages'
import CircularProgress from '@components/CircularProgress'
import {
  addNetworkDisconnectError,
  onNetworkActionButton,
  processNetworkError,
  reloadApp,
} from '@utils/network'
import { useRouter } from 'next/router'
import { HTTP_CONFIG } from '@common/constants'
import NetworkErrorPopup from '@components/NetworkErrorPopUp'
import useLexicon from '@hooks/useLexicon'
import { translate } from '@utils/lexiconHelpers'

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

function WorkspaceContainer() {
  const router = useRouter()
  const classes = useStyles()
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [selections, setSelections] = useState([])
  const [networkError, setNetworkError] = useState(null)
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
      savedChanges,
    },
    actions: {
      logout,
      setQuote,
      setSupportedBibles,
      setCurrentLayout,
      setTokenNetworkError,
      setLastError,
      updateTaDetails,
      setGreekRepoUrl,
      setHebrewRepoUrl,
      setSavedChanges,
      showSaveChangesPrompt,
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
   * in the case of a network error, process and display error dialog
   * @param {string} errorMessage - optional error message returned
   * @param {number} httpCode - http code returned
   */
  function processError(errorMessage, httpCode=0) {
    processNetworkError(errorMessage, httpCode, logout, router, setNetworkError, setLastError )
  }

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
          hideClose={true}
          /* show reload if send feedback not enabled */
          onRetry={!networkError.actionButtonText ? reloadApp : null}
        />
      )
    }
    return null
  }

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
        processNetworkError(error || message, resourceStatus, logout, router, setNetworkError, setLastError, setLastError)
      } else {
        if (isAccessError) { // we only show popup for access errors
          addNetworkDisconnectError(error || message, 0, logout, router, setNetworkError, setLastError)
        }
      }
    }
  }

  const commonScriptureCardConfigs = {
    isNT,
    server,
    appRef,
    classes,
    getLanguage,
    useUserLocalStorage,
    originalLanguageOwner: scriptureOwner,
    onResourceError,
    httpConfig: HTTP_CONFIG,
    greekRepoUrl,
    hebrewRepoUrl,
    fetchGlossesForVerse,
    getLexiconData,
    translate,
  }

  const commonResourceCardConfigs = {
    classes,
    chapter,
    verse,
    server,
    owner,
    appRef,
    languageId,
    useUserLocalStorage,
    onResourceError,
    loggedInUser,
    authentication,
  }

  useEffect(() => {
    setWorkspaceReady(false)

    if (owner && languageId && appRef && server && loggedInUser) {
      getResourceBibles({
        bookId,
        chapter,
        verse,
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
        setWorkspaceReady(true)
      }).catch((e) => {
        setWorkspaceReady(true)
        processError(e.toString())
      })
    }// eslint-disable-next-line
  }, [owner, languageId, appRef, server, loggedInUser])

  useEffect(() => {
    const missingOrignalBibles = !hebrewRepoUrl || !greekRepoUrl

    if (missingOrignalBibles) { // if we don't have a path
      setWorkspaceReady(false)
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
        setWorkspaceReady(true)
      } else if (changed) { // force redraw
        console.log(`WorkspaceContainer - original bible repos changed, force reload`)
        setWorkspaceReady(false)
        setTimeout(() => {
          setWorkspaceReady(true)
        }, 500)
      }
    })
  }, [])

  const isNewTestament = isNT(bookId)
  const originalScripture = {
    reference: {
      projectId: bookId,
      chapter,
      verse,
    },
    isNT: () => isNT(bookId),
    resource: {
      owner: 'unfoldingWord',
      originalLanguageOwner: 'unfoldingWord',
      languageId: isNewTestament ? NT_ORIG_LANG : OT_ORIG_LANG,
      resourceId: ORIGINAL_SOURCE,
    },
    getLanguage: () => ({ direction: isNewTestament ? 'ltr' : 'rtl' }),
  }

  const config = {
    server,
    ...HTTP_CONFIG,
  }

  const { server: origServer, resourceLink: origResourceLink } = useMemo(() => splitUrl(isNewTestament ? greekRepoUrl : hebrewRepoUrl), [isNewTestament, greekRepoUrl, hebrewRepoUrl])

  const originalScriptureConfig = useScripture({
    ...originalScripture,
    resource: {
      ...originalScripture.resource,
      resourceId: isNewTestament ? NT_ORIG_LANG_BIBLE : OT_ORIG_LANG_BIBLE,
      projectId: isNewTestament ? NT_ORIG_LANG_BIBLE : OT_ORIG_LANG_BIBLE,
      ref: appRef,
    },
    resourceLink: origResourceLink,
    config: {
      ...config,
      server: origServer,
    },
  })

  return (
    (tokenNetworkError || networkError || !workspaceReady) ? // Do not render workspace until user logged in and we have user settings
      <>
        {showNetworkError()}
        <CircularProgress size={180} />
      </>
      :
      <SelectionsContextProvider
        selections={selections}
        onSelections={setSelections}
        quote={selectedQuote?.quote}
        occurrence={selectedQuote?.occurrence?.toString()}
        verseObjects={originalScriptureConfig.verseObjects || []}
      >
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
          <ScriptureCard
            cardNum={0}
            title='Literal Translation'
            reference={{
              chapter,
              verse,
              bookId,
              projectId: bookId,
            }}
            resource={{
              owner,
              languageId,
              resourceId: TARGET_LITERAL,
              originalLanguageOwner: scriptureOwner,
            }}
            {...commonScriptureCardConfigs}
          />

          <ScriptureCard
            cardNum={1}
            title='Original Source'
            reference={{
              chapter,
              verse,
              bookId,
              projectId: bookId,
            }}
            resource={{
              owner,
              languageId,
              resourceId: ORIGINAL_SOURCE,
              originalLanguageOwner: scriptureOwner,
            }}
            {...commonScriptureCardConfigs}
          />

          <ScriptureCard
            cardNum={2}
            title='Simplified Translation'
            reference={{
              chapter,
              verse,
              bookId,
              projectId: bookId,
            }}
            resource={{
              owner,
              languageId,
              resourceId: TARGET_SIMPLIFIED,
              originalLanguageOwner: scriptureOwner,
            }}
            {...commonScriptureCardConfigs}
          />

          <ResourceCard
            title='translationNotes'
            id='resource_card_tn'
            {...commonResourceCardConfigs}
            filePath={null}
            resourceId={'tn'}
            projectId={bookId}
            setQuote={setQuote}
            selectedQuote={selectedQuote}
            updateTaDetails={updateTaDetails}
            loggedInUser={loggedInUser}
            authentication={authentication}
            setSavedChanges={setSavedChanges}
            showSaveChangesPrompt={showSaveChangesPrompt}
          />
          <ResourceCard
            title='translationAcademy'
            id='resource_card_ta'
            {...commonResourceCardConfigs}
            resourceId={'ta'}
            projectId={taArticle?.projectId}
            filePath={taArticle?.filePath}
            errorMessage={taArticle ? null : 'No article is specified in the current note.'}
            loggedInUser={loggedInUser}
            authentication={authentication}
            setSavedChanges={setSavedChanges}
            showSaveChangesPrompt={showSaveChangesPrompt}
          />
          <ResourceCard
            title='translationWords List'
            id='resource_card_twl'
            {...commonResourceCardConfigs}
            viewMode={'list'}
            resourceId={'twl'}
            projectId={bookId}
            filePath={null}
            setQuote={setQuote}
            selectedQuote={selectedQuote}
            disableFilters
            disableNavigation
            hideMarkdownToggle
            loggedInUser={loggedInUser}
            authentication={authentication}
            setSavedChanges={setSavedChanges}
            showSaveChangesPrompt={showSaveChangesPrompt}
          />
          <ResourceCard
            title='translationWords Article'
            id='resource_card_twa'
            {...commonResourceCardConfigs}
            viewMode={'markdown'}
            resourceId={'twl'}
            projectId={bookId}
            filePath={null}
            setQuote={setQuote}
            selectedQuote={selectedQuote}
            disableFilters
            loggedInUser={loggedInUser}
            authentication={authentication}
            setSavedChanges={setSavedChanges}
            showSaveChangesPrompt={showSaveChangesPrompt}
          />
          <ResourceCard
            title='translationQuestions'
            id='resource_card_tq'
            {...commonResourceCardConfigs}
            resourceId={'tq'}
            projectId={bookId}
            filePath={null}
            viewMode='question'
            disableFilters
            loggedInUser={loggedInUser}
            authentication={authentication}
            setSavedChanges={setSavedChanges}
            showSaveChangesPrompt={showSaveChangesPrompt}
          />
        </Workspace>
      </SelectionsContextProvider>
  )
}

export default WorkspaceContainer

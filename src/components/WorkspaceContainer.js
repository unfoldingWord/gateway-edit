import {
  useState,
  useEffect,
  useContext,
} from 'react'
import * as isEqual from 'deep-equal'
import { Workspace } from 'resource-workspace-rcl'
import { makeStyles } from '@material-ui/core/styles'
import { SelectionsContextProvider } from 'scripture-resources-rcl'
import {
  OT_ORIG_LANG,
  NT_ORIG_LANG,
  useScripture,
  ScriptureCard,
  TARGET_LITERAL,
  ORIGINAL_SOURCE,
  TARGET_SIMPLIFIED,
  NT_ORIG_LANG_BIBLE,
  OT_ORIG_LANG_BIBLE,
} from 'single-scripture-rcl'
import DraggableCard from 'translation-helps-rcl/dist/components/DraggableCard'
import useResourceClickListener from 'translation-helps-rcl/dist/hooks/useResourceClickListener'
import ResourceCard from '@components/ResourceCard'
import { getResourceBibles } from '@utils/resources'
import { StoreContext } from '@context/StoreContext'
import { NT_BOOKS } from '@common/BooksOfTheBible'
import { getLanguage } from '@common/languages'
import CircularProgress from '@components/CircularProgress'
import { processNetworkError, showNetworkErrorPopup } from '@utils/network'
import { useRouter } from 'next/router'
import { MANIFEST_INVALID_ERROR } from '@common/constants'

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
      branch,
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
      tokenNetworkError,
    },
    actions: {
      logout,
      setQuote,
      setSupportedBibles,
      setCurrentLayout,
      setTokenNetworkError,
      setLastError,
      updateTaDetails,
    },
  } = useContext(StoreContext)

  const [{
    loading, title, content, error,
  }, clearContent] = useResourceClickListener({
    owner,
    server,
    branch,
    taArticle,
    languageId,
  })

  const layout = {
    widths: [
      [1, 1, 1],
      [2, 2],
      [1, 1.5, 1.5],
    ],
    heights: [[5], [10, 10], [10, 10]],
    minW: 3,
    minH: 4,
  }

  if (currentLayout) {
    // Migrating cached currentLayout to include min width & min height.
    if (!currentLayout[0].minW || !currentLayout[0].minH) {
      const newCurrentLayout = currentLayout.map(l => {
        l.minW = layout.minW
        l.minH = layout.minH
        return l
      })
      setCurrentLayout(newCurrentLayout)
    }

    layout.absolute = currentLayout
  }

  function isNT(bookId) {
    return NT_BOOKS.includes(bookId)
  }

  /**
   * in the case of a network error, process and display error dialog
   * @param {string} errorMessage - optional error message returned
   * @param {number} httpCode - http code returned
   */
  function processError(errorMessage, httpCode=0) {
    processNetworkError(errorMessage, httpCode, setNetworkError, setLastError )
  }

  const commonScriptureCardConfigs = {
    isNT,
    server,
    branch,
    classes,
    getLanguage,
    useUserLocalStorage,
    originalLanguageOwner: scriptureOwner,
  }

  useEffect(() => {
    setWorkspaceReady(false)

    if (owner && languageId && branch && server && loggedInUser) {
      getResourceBibles({
        bookId,
        chapter,
        verse,
        resourceId: languageId === 'en' ? 'ult' : 'glt',
        owner,
        languageId,
        branch,
        server,
      }).then(results => {
        const { bibles, httpCode, resourceLink } = results

        if (bibles?.length) {
          if (!isEqual(bibles, supportedBibles)) {
            console.log(`found ${bibles?.length} bibles`)
            setSupportedBibles(bibles) //TODO blm: update bible refs
          }
        } else {
          processError(`${MANIFEST_INVALID_ERROR} ${resourceLink}`, httpCode)
          console.log(`no bibles found`)
        }
        setWorkspaceReady(true)
      }).catch((e) => {
        setWorkspaceReady(true)
        processError(e.toString())
      }) // eslint-disable-next-line
    }
  }, [owner, languageId, branch, server, loggedInUser])

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
      languageId: isNT(bookId) ? NT_ORIG_LANG : OT_ORIG_LANG,
      resourceId: ORIGINAL_SOURCE,
    },
    getLanguage: () => ({ direction: isNT(bookId) ? 'ltr' : 'rtl' }),
  }

  const config = {
    server,
    branch,
    cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
  }

  const originalScriptureConfig = useScripture({
    ...originalScripture,
    resource: {
      ...originalScripture.resource,
      resourceId: isNT(bookId) ? NT_ORIG_LANG_BIBLE : OT_ORIG_LANG_BIBLE,
      projectId: isNT(bookId) ? NT_ORIG_LANG_BIBLE : OT_ORIG_LANG_BIBLE,
    },
    config,
  })

  return (
    (tokenNetworkError || networkError || !workspaceReady) ? // Do not render workspace until user logged in and we have user settings
      <>
        {
          // this is specifically for network or internet error on startup, in this case sending feedback is not an option, but reload is about the only option
          showNetworkErrorPopup({
            networkError: tokenNetworkError,
            setNetworkError: setTokenNetworkError,
            logout,
            router,
            noActionButton:true,
            addRetryButton: true,
          })
        }
        {
          // this is for network error getting books list
          showNetworkErrorPopup({ networkError, setNetworkError, logout, router })
        }
        <CircularProgress size={180} />
      </>
      :
      <SelectionsContextProvider
        selections={selections}
        onSelections={setSelections}
        quote={selectedQuote?.quote}
        occurrence={selectedQuote?.occurrence}
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
          />
          :
          null
        }
        <Workspace
          rowHeight={25}
          layout={layout}
          classes={classes}
          gridMargin={[15, 15]}
          onLayoutChange={setCurrentLayout}
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
            classes={classes}
            chapter={chapter}
            verse={verse}
            server={server}
            owner={owner}
            branch={branch}
            filePath={null}
            resourceId={'tn'}
            projectId={bookId}
            languageId={languageId}
            setQuote={setQuote}
            selectedQuote={selectedQuote}
            updateTaDetails={updateTaDetails}
            useUserLocalStorage={useUserLocalStorage}
          />
          <ResourceCard
            title='translationAcademy'
            id='resource_card_ta'
            classes={classes}
            chapter={chapter}
            verse={verse}
            server={server}
            owner={owner}
            branch={branch}
            languageId={languageId}
            resourceId={'ta'}
            projectId={taArticle?.projectId}
            filePath={taArticle?.filePath}
            errorMessage={taArticle ? null : 'No article is specified in the current note.'}
            useUserLocalStorage={useUserLocalStorage}
          />
          <ResourceCard
            title='translationWords List'
            id='resource_card_twl'
            classes={classes}
            chapter={chapter}
            verse={verse}
            server={server}
            owner={owner}
            branch={branch}
            viewMode={'list'}
            languageId={languageId}
            resourceId={'twl'}
            projectId={bookId}
            filePath={null}
            setQuote={setQuote}
            selectedQuote={selectedQuote}
            disableFilters
            disableNavigation
            hideMarkdownToggle
            useUserLocalStorage={useUserLocalStorage}
          />
          <ResourceCard
            title='translationWords Article'
            id='resource_card_twa'
            classes={classes}
            chapter={chapter}
            verse={verse}
            server={server}
            owner={owner}
            branch={branch}
            viewMode={'markdown'}
            languageId={languageId}
            resourceId={'twl'}
            projectId={bookId}
            filePath={null}
            setQuote={setQuote}
            selectedQuote={selectedQuote}
            disableFilters
            hideMarkdownToggle
            useUserLocalStorage={useUserLocalStorage}
          />
          <ResourceCard
            title='translationQuestions'
            id='resource_card_tq'
            classes={classes}
            chapter={chapter}
            verse={verse}
            server={server}
            owner={owner}
            branch={branch}
            languageId={languageId}
            resourceId={'tq'}
            projectId={bookId}
            filePath={null}
            viewMode='question'
            disableFilters
            useUserLocalStorage={useUserLocalStorage}
          />
        </Workspace>
      </SelectionsContextProvider>
  )
}

export default WorkspaceContainer

import { useContext, useState } from 'react'
import * as isEqual from 'deep-equal'
import { Workspace } from 'resource-workspace-rcl'
import { makeStyles } from '@material-ui/core/styles'
import ResourceCard from '@components/ResourceCard'
import { getResourceBibles } from '@utils/resources'
import {
  useScripture,
  ScriptureCard,
  ORIGINAL_SOURCE,
  TARGET_LITERAL,
  TARGET_SIMPLIFIED,
} from 'single-scripture-rcl'
import { ReferenceContext } from '@context/ReferenceContext'
import { NT_BOOKS } from '@common/BooksOfTheBible'
import useLocalStorage from '@hooks/useLocalStorage'
import { getLanguage } from '@common/languages'
import { SelectionsContextProvider } from 'scripture-resources-rcl'

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
  const classes = useStyles()
  const [selections, setSelections] = useState([])
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
    },
    actions: {
      setQuote,
      updateTaDetails,
      setSupportedBibles,
      setCurrentLayout,
    },
  } = useContext(ReferenceContext)

  const layout = {
    widths: [
      [1, 1, 1],
      [2, 2],
      [2, 2],
    ],
    heights: [[5], [10, 10], [10, 10]],
  }

  if (currentLayout) {
    layout.absolute = currentLayout
  }

  function isNT(bookId) {
    return NT_BOOKS.includes(bookId)
  }

  const commonScriptureCardConfigs = {
    isNT,
    server,
    branch,
    classes,
    getLanguage,
    useLocalStorage,
    originalLanguageOwner: scriptureOwner,
  }

  getResourceBibles({
    bookId,
    chapter,
    verse,
    resourceId: languageId === 'en' ? 'ult' : 'glt',
    owner,
    languageId,
    branch,
    server,
  }).then(bibles => {
    if (bibles?.length) {
      if (!isEqual(bibles, supportedBibles )) {
        console.log(`found ${bibles?.length} bibles`)
        setSupportedBibles(bibles) //TODO blm: update bible refs
      }
    } else {
      console.log(`no bibles`)
    }
  })

  const greekScripture = {
    reference: {
      projectId: bookId,
      chapter,
      verse,
    },
    isNT: () => true,
    resource: {
      owner: 'unfoldingWord',
      originalLanguageOwner: 'unfoldingWord',
      languageId: 'el-x-koine',
      resourceId: ORIGINAL_SOURCE,
    },
    getLanguage: () => ({ direction: 'ltr' }),
  }

  const config = {
    server: 'https://git.door43.org',
    cache: { maxAge: 1 * 1 * 1 * 60 * 1000 },
    branch: 'master',
  }

  const greekScriptureConfig = useScripture({
    ...greekScripture,
    resource: {
      ...greekScripture.resource,
      resourceId: 'ugnt',
      projectId: 'ugnt',
    },
    config,
  })

  return (
    <SelectionsContextProvider
      selections={selections}
      onSelections={setSelections}
      quote={selectedQuote?.quote}
      occurrence={selectedQuote?.occurrence}
      verseObjects={greekScriptureConfig.verseObjects || []}
    >
      <Workspace
        rowHeight={25}
        layout={layout}
        classes={classes}
        gridMargin={[15, 15]}
        onLayoutChange={setCurrentLayout}
      >
        <ScriptureCard
          cardNum={0}
          title='Scripture'
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
          disableWordPopover={true}
          {...commonScriptureCardConfigs}
        />

        <ScriptureCard
          cardNum={1}
          title='Scripture'
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
          title='Scripture'
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
          disableWordPopover={true}
          {...commonScriptureCardConfigs}
        />

        <ResourceCard
          title='translationNotes'
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
        />
        <ResourceCard
          title='translationAcademy'
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
        />
        <ResourceCard
          title='translationWords'
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
        />
        <ResourceCard
          title='translationQuestions'
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
        />
      </Workspace>
    </SelectionsContextProvider>
  )
}

export default WorkspaceContainer

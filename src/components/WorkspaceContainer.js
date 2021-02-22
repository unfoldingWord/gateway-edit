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

  console.log({ selections, selectedQuote })
  console.log(greekScriptureConfig.verseObjects)

  return (
    <SelectionsContextProvider
      quote={selectedQuote?.quote}
      occurrence={selectedQuote?.occurrence}
      selections={selections}
      verseObjects={greekScriptureConfig.verseObjects || []}
      onSelections={setSelections}
    >
      <Workspace
        rowHeight={25}
        layout={layout}
        classes={classes}
        gridMargin={[15, 15]}
        onLayoutChange={setCurrentLayout}
      >
        <ScriptureCard
          isNT={isNT}
          cardNum={0}
          classes={classes}
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
          server={server}
          branch={branch}
          getLanguage={getLanguage}
          disableWordPopover={true}
          useLocalStorage={useLocalStorage}

        // owner={owner}
        // chapter={chapter}
        // verse={verse}
        // languageId={languageId}
        // resourceId={TARGET_LITERAL}
        // bookId={bookId}
        // {...commonScriptureCardConfigs}
        />

        <ScriptureCard
          isNT={isNT}
          cardNum={1}
          classes={classes}
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
          server={server}
          branch={branch}
          getLanguage={getLanguage}
          useLocalStorage={useLocalStorage}
        // cardNum={1}
        // title='Scripture'
        // chapter={chapter}
        // verse={verse}
        // server={server}
        // owner={owner}
        // branch={branch}
        // languageId={languageId}
        // resourceId={ORIGINAL_SOURCE}
        // bookId={bookId}
        // {...commonScriptureCardConfigs}
        />

        <ScriptureCard
          isNT={isNT}
          cardNum={2}
          classes={classes}
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
          server={server}
          branch={branch}
          getLanguage={getLanguage}
          disableWordPopover={true}
          useLocalStorage={useLocalStorage}
        // cardNum={2}
        // title='Scripture'
        // chapter={chapter}
        // verse={verse}
        // server={server}
        // owner={owner}
        // branch={branch}
        // languageId={languageId}
        // resourceId={TARGET_SIMPLIFIED}
        // bookId={bookId}
        // disableWordPopover={true}
        // {...commonScriptureCardConfigs}
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

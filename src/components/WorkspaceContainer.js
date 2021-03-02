import { useContext, useState } from 'react'
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
import ResourceCard from '@components/ResourceCard'
import { getResourceBibles } from '@utils/resources'
import { ReferenceContext } from '@context/ReferenceContext'
import { NT_BOOKS } from '@common/BooksOfTheBible'
import useLocalStorage from '@hooks/useLocalStorage'
import { getLanguage } from '@common/languages'

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
      [1, 1.5, 1.5],
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
    <SelectionsContextProvider
      selections={selections}
      onSelections={setSelections}
      quote={selectedQuote?.quote}
      occurrence={selectedQuote?.occurrence}
      verseObjects={originalScriptureConfig.verseObjects || []}
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
          title='translationWords List'
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
          title='translationWords Article'
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
          viewMode='question'
          disableFilters
        />
      </Workspace>
    </SelectionsContextProvider>
  )
}

export default WorkspaceContainer

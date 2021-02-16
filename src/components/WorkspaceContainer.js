import { useContext } from 'react'
import * as isEqual from 'deep-equal'
import { Workspace } from 'resource-workspace-rcl'
import { makeStyles } from '@material-ui/core/styles'
import ResourceCard from '@components/ResourceCard'
import { getResourceBibles } from '@utils/resources'
import {
  ScriptureCard,
  ORIGINAL_SOURCE,
  TARGET_LITERAL,
  TARGET_SIMPLIFIED,
} from 'single-scripture-rcl'
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
    },
    actions: {
      updateTaDetails,
      setQuote,
      setSupportedBibles,
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

  function isNT(bookId) {
    return NT_BOOKS.includes(bookId)
  }

  const commonScriptureCardConfigs = {
    classes,
    useLocalStorage,
    isNT,
    getLanguage,
    originalLanguageOwner: scriptureOwner,
  }

  console.log(`found ${supportedBibles?.length} bibles`)
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

  return (
    <Workspace
      rowHeight={25}
      layout={layout}
      gridMargin={[15, 15]}
      classes={classes}
    >
      <ScriptureCard
        cardNum={0}
        title='Scripture'
        chapter={chapter}
        verse={verse}
        server={server}
        owner={owner}
        branch={branch}
        languageId={languageId}
        resourceId={TARGET_LITERAL}
        bookId={bookId}
        disableWordPopover={true}
        {...commonScriptureCardConfigs}
      />

      <ScriptureCard
        cardNum={1}
        title='Scripture'
        chapter={chapter}
        verse={verse}
        server={server}
        owner={owner}
        branch={branch}
        languageId={languageId}
        resourceId={ORIGINAL_SOURCE}
        bookId={bookId}
        {...commonScriptureCardConfigs}
      />

      <ScriptureCard
        cardNum={2}
        title='Scripture'
        chapter={chapter}
        verse={verse}
        server={server}
        owner={owner}
        branch={branch}
        languageId={languageId}
        resourceId={TARGET_SIMPLIFIED}
        bookId={bookId}
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
        languageId={languageId}
        resourceId={'tn'}
        projectId={bookId}
        filePath={null}
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
  )
}

export default WorkspaceContainer

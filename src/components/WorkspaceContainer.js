import { useContext } from 'react'
import { Workspace } from 'resource-workspace-rcl'
import { makeStyles } from '@material-ui/core/styles'
import ResourceCard from '@components/ResourceCard'
import ScriptureCard from '@components/ScriptureCard'
import { ReferenceContext } from '@context/ReferenceContext'
import { ORIGINAL_SOURCE, TARGET_LITERAL, TARGET_SIMPLIFIED } from '@hooks/useScriptureSettings'
import {
  NT_BOOKS,
  NT_ORIG_LANG,
  NT_ORIG_LANG_BIBLE,
  OT_ORIG_LANG,
  OT_ORIG_LANG_BIBLE,
} from '@common/BooksOfTheBible'

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
      bibleReference: { bookId, chapter, verse },
    },
    actions: { updateTaDetails, setQuote },
  } = useContext(ReferenceContext)

  const layout = {
    widths: [
      [1, 1, 1],
      [2, 2],
      [2, 2],
    ],
    heights: [[5], [10, 10], [10, 10]],
  }

  const scriptureOwner = 'unfoldingWord' //TODO blm: for testing use since test_org does not have enough bibles

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
        classes={classes}
        chapter={chapter}
        verse={verse}
        server={server}
        owner={scriptureOwner}
        branch={branch}
        languageId={languageId}
        resourceId={TARGET_LITERAL}
        bookId={bookId}
        disableWordPopover={true}
      />

      <ScriptureCard
        cardNum={1}
        title='Scripture'
        classes={classes}
        chapter={chapter}
        verse={verse}
        server={server}
        owner={scriptureOwner}
        branch={branch}
        languageId={ORIGINAL_SOURCE}
        resourceId={ORIGINAL_SOURCE}
        bookId={bookId}
      />

      <ScriptureCard
        cardNum={2}
        title='Scripture'
        classes={classes}
        chapter={chapter}
        verse={verse}
        server={server}
        owner={scriptureOwner}
        branch={branch}
        languageId={languageId}
        resourceId={TARGET_SIMPLIFIED}
        bookId={bookId}
        disableWordPopover={true}
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

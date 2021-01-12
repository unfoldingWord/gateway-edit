import { useContext } from 'react'
import { Workspace } from 'resource-workspace-rcl'
import { makeStyles } from '@material-ui/core/styles'
import ResourceCard from '@components/ResourceCard'
import { ReferenceContext } from '@context/ReferenceContext'

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    margin: '0 1px !important',
    height: '100%',
    width: '100%',
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
      bibleReference: { bookId, chapter, verse },
    },
    actions: { updateTaDetails },
  } = useContext(ReferenceContext)

  const layout = {
    widths: [[1, 1], [1, 1], [1]],
  }

  return (
    <Workspace
      rowHeight={410}
      layout={layout}
      gridMargin={[15, 15]}
      classes={classes}
    >
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
        viewMode={'markdown'}
        languageId={languageId}
        resourceId={'twl'}
        projectId={bookId}
        filePath={null}
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

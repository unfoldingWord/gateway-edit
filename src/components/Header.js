import {
  useContext,
  useEffect,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import { useFilePicker } from 'use-file-picker'
import { useRouter } from 'next/router'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import MenuIcon from '@material-ui/icons/Menu'
import AppBar from '@material-ui/core/AppBar'
import Drawer from '@components/Drawer'
import BibleReference from '@components/BibleReference'
import { AuthContext } from '@context/AuthContext'
import { StoreContext } from '@context/StoreContext'
import FeedbackPopup from '@components/FeedbackPopup'
// TODO: Enable buttons once ready to fully implement functionality
// import LinkIcon from '@material-ui/icons/Link'
// import Button from '@material-ui/core/Button'
// import SubmitButton from '@components/SubmitButton'
// import ShareIcon from '@material-ui/icons/Share'

const useStyles = makeStyles(theme => ({
  root: { flexGrow: 1 },
  button: {
    minWidth: '40px',
    padding: '5px 0px',
    marginRight: theme.spacing(3),
  },
  icon: { width: '40px' },
  menuButton: { marginRight: theme.spacing(1) },
  title: {
    flexGrow: 1,
    cursor: 'pointer',
  },
}))

export default function Header({
  title,
  resetResourceLayout,
  authentication: { user },
  feedback,
  setFeedback,
}) {
  const [openFileSelector, { filesContent, loading }] = useFilePicker({ accept: '.tsv' })
  const classes = useStyles()
  const router = useRouter()
  const [drawerOpen, setOpen] = useState(false)
  const { actions: { logout } } = useContext(AuthContext)
  const {
    state: {
      filter,
    },
    actions: {
      checkUnsavedChanges,
      setFilter,
      setFilterTSV,
    } } = useContext(StoreContext)

  useEffect(() => {
    if (filesContent?.length) {
      console.log(filesContent)
      const filename = filesContent[0].name
      const content = filesContent[0].content

      if (content) {
        setFilter({
          enabled: true,
          filename,
          rawTSV: content,
          filteredBooks: null,
        })
      }
    }
  }, [ filesContent ])

  const handleDrawerOpen = () => {
    if (!drawerOpen) {
      setOpen(true)
    }
  }

  const handleDrawerClose = () => {
    if (drawerOpen) {
      setOpen(false)
    }
  }

  const doShowFeedback = () => {
    setFeedback && setFeedback(true)
  }

  const doHideFeedback = () => {
    setFeedback && setFeedback(false)
  }

  function handleTsvButton() {
    if (!filter?.enabled) { // load TSV file
      console.log('Fetching TSV')
      openFileSelector()
    } else { // clear filter
      console.log('Toggling Filter off')
      setFilter({ enabled: false })
    }
  }

  const searchStr = filter?.enabled && filter.config?.searchStr

  return (
    <header>
      <AppBar position='static'>
        <Toolbar>
          <div className='flex flex-1 justify-center items-center'>
            <IconButton
              edge='start'
              className={classes.menuButton}
              color='inherit'
              aria-label='menu'
              onClick={handleDrawerOpen}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant='h6'
              className={classes.title}
              onClick={() => router.push('/')}
            >
              {title}
            </Typography>
          </div>
          <div className='flex flex-1 justify-center items-center'>
            <BibleReference />
          </div>
          <div className='flex flex-1'>
            <button onClick={() => handleTsvButton()}>{filter?.enabled ? 'Filter OFF' : 'Open TSV' } </button>
          </div>
          <div className='flex flex-1'>
            <b>
              {searchStr ? `Filter: ${searchStr}` : ''}
            </b>
          </div>
          <div className='flex flex-1 justify-end'>
            {/* <Button
              className={classes.button}
              variant='outlined'
              onClick={() => {}}
            >
              <LinkIcon classes={{ root: classes.icon }} htmlColor='#ffffff' />
            </Button>
            <Button
              className={classes.button}
              variant='outlined'
              onClick={() => {}}
            >
              <ShareIcon classes={{ root: classes.icon }} htmlColor='#ffffff' />
            </Button>
            <SubmitButton variant='contained' disableElevation active={false} /> */}
          </div>
        </Toolbar>
      </AppBar>
      <Drawer
        user={user}
        logout={logout}
        open={drawerOpen}
        onOpen={handleDrawerOpen}
        onClose={handleDrawerClose}
        checkUnsavedChanges={checkUnsavedChanges}
        resetResourceLayout={resetResourceLayout}
        showFeedback={doShowFeedback}
      />
      { feedback ?
        <FeedbackPopup
          open
          {...feedback}
          onClose={doHideFeedback}
        />
        :
        null
      }
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string,
  authentication: PropTypes.object,
  resetResourceLayout: PropTypes.func,
  storeContext: PropTypes.object,
  feedback: PropTypes.bool,
  setFeedback: PropTypes.func,
}

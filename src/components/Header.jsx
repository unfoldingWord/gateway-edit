import React, {
  useState,
  useContext,
  useEffect,
  useRef
} from 'react'
import PropTypes from 'prop-types'
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
import useUpdateCardsProps from '../hooks/useUpdateCardsProps'
import { UpdateBranchButton, ErrorDialog } from 'translation-helps-rcl'
import ErrorPopup from "@components/ErrorPopUp";
import {translate} from "@utils/lexiconHelpers";
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
  mergeStatusForCards,
}) {
  const oldCardMergeGroupings = useRef(null)
  const classes = useStyles()
  const router = useRouter()
  const [drawerOpen, setOpen] = useState(false)
  const [cardWithConflicts, setCardWithConflicts] = useState(false)
  const [cardWithError, setCardWithError] = useState(false)
  const { actions: { logout } } = useContext(AuthContext)
  const {
    state: {
      cardsSaving,
      cardsLoadingUpdate,
      mergeCheck
    },
    actions: {
      checkUnsavedChanges,
    }
  } = useContext(StoreContext)

  const updateButtonProps = useUpdateCardsProps({ mergeStatusForCards });
  const {
    cardMergeGroupings,
    dialogMessage,
    dialogTitle,
    isErrorDialogOpen,
    onCloseErrorDialog,
  } = updateButtonProps;

  const cardWithConflicts_ = cardMergeGroupings?.cardsWithConflicts?.length > 0
  const cardWithError_ = cardMergeGroupings?.cardsWithError?.length > 0

  useEffect(() => {
    if (mergeCheck > 0) {
      if (cardWithConflicts_) {
        const previousCardWithConflicts = oldCardMergeGroupings.current?.cardsWithConflicts?.length > 0
        if (!previousCardWithConflicts  && !cardWithConflicts) {
          setCardWithConflicts(true)
          oldCardMergeGroupings.current = cardMergeGroupings
        }
      }
      if (cardWithError_) {
        const previousCardWithErrors = oldCardMergeGroupings.current?.cardsWithError?.length > 0
        if (!previousCardWithErrors && !cardWithError) {
          setCardWithError(true)
          oldCardMergeGroupings.current = cardMergeGroupings
        }
      }
    }
  }, [cardWithConflicts_, cardWithError_])

  useEffect(() => {
    oldCardMergeGroupings.current = cardMergeGroupings
  }, [mergeCheck, cardWithConflicts_])

  /**
   * render an error dialog
   * @param title
   * @param message
   * @return {React.JSX.Element}
   * @private
   */
  function showWarningDialog_(title, message) {
    return (
      <ErrorPopup
        title={translate(title)}
        message={translate(message)}
        dimBackground={true}
        hideClose={true}
        onClose={() => {
          setAuthError(false)
        }}
        actionButtonStr={translate('ok')}
        onActionButton={() => {
          cardWithError ? setCardWithError(false) : setCardWithConflicts(false);
        }}
      />
    );
  }

  /**
   * show either merge error or merge conflict dialog
   * @return {React.JSX.Element}
   */
  function showWarningDialog() {
    if (cardWithError) {
      return showWarningDialog_('merge_error_title', 'merge_error_message')
    } else {
      return showWarningDialog_('merge_conflict_title', 'merge_conflict_message')
    }
  }

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

  const loadingProps = { color: "secondary" };

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


          <div className='flex flex-1 justify-end'>
            <UpdateBranchButton {...updateButtonProps} isLoading={cardsLoadingUpdate?.length || cardsSaving?.length} loadingProps={loadingProps}/>
            <ErrorDialog title={dialogTitle} content={dialogMessage} open={isErrorDialogOpen} onClose={onCloseErrorDialog} isLoading={cardsLoadingUpdate?.length || cardsSaving?.length} />
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
      { (cardWithError || cardWithConflicts_) && showWarningDialog() }
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
  mergeStatusForCards: PropTypes.object,
}

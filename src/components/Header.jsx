import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
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
import isEqual from "deep-equal";
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
 authentication: { user },
 feedback,
 mergeStatusForCards,
 resetResourceLayout,
 setFeedback,
 translate,
 title,
}) {
  const classes = useStyles()
  const router = useRouter()
  const [drawerOpen, setOpen] = useState(false)
  const [cardWithConflicts, setCardWithConflicts] = useState({})
  const [cardWithError, setCardWithError] = useState({})
  const [cardToMerge, setCardToMerge] = useState({})

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
    onClick: onClickUpdateCards,
  } = updateButtonProps;

  /**
   *
   * @param {boolean} show
   * @param {number} lastCheckLevel
   * @return {{show: boolean, lastCheckLevel: number}}
   */
  function makeState(show, lastCheckLevel) {
    return {
      show,
      lastCheckLevel,
    }
  }

  /**
   * change show while keeping lastCheckLevel
   * @param {boolean} show
   * @param {{show: boolean, lastCheckLevel: number}} previousMergeState
   * @return {{show: boolean, lastCheckLevel: number}}
   */
  function updateShowState(show, previousMergeState) {
    const retVal = {
      show,
      lastCheckLevel: previousMergeState?.lastCheckLevel || 0,
    };
    return retVal;
  }

  /**
   * set show flag only if mergeCheck is newer than lastCheckLevel
   * @param {{show: boolean, lastCheckLevel: number}} previousMergeState
   * @return {{show: boolean, lastCheckLevel: number}}
   */
  function showIfNewer(previousMergeState) {
    const update = (mergeCheck > (previousMergeState?.lastCheckLevel || 0))
    if (update) {
      const retVal = {
        show: true,
        lastCheckLevel: mergeCheck
      };
      return retVal
    }
    return previousMergeState;
  }

  const newCardMergeState = useMemo(() => {
    const cardWithConflicts = cardMergeGroupings?.cardsWithConflicts?.length > 0
    const cardWithError = cardMergeGroupings?.cardsWithError?.length > 0
    const cardToMerge = cardMergeGroupings?.cardsToMerge?.length > 0

    return {
      cardWithConflicts,
      cardWithError,
      cardToMerge,
    }
  }, [cardMergeGroupings])

  useEffect(() => {
    console.log(`Header - mergeCheck changed`, {
      mergeCheck,
    })
  }, [mergeCheck])

  useEffect(() => { // if mergeStatusForCards changed, check for new merge warnings
    if (mergeCheck > 0) {
      const state = newCardMergeState
      if (state.cardWithConflicts && !cardWithConflicts?.show) {
        setCardWithConflicts(showIfNewer(cardWithConflicts))
      }
      if (state.cardWithError && !cardWithError?.show) {
        setCardWithError(showIfNewer(cardWithError))
      }
      if (state.cardToMerge && !cardToMerge?.show) {
        setCardToMerge(showIfNewer(cardToMerge))
      }
    }
  }, [mergeStatusForCards])

 /**
  * render an error dialog
  * @param {string} title
  * @param {string} messageID - contains key to lookup localized message
  * @param {string} messageText - additional text to display
  * @param {function} onClose
  * @param {{show: boolean, lastCheckLevel: number}} currentState
  * @return {React.JSX.Element}
  * @private
  */
  function showWarningDialog_(title, message, onClose, currentState, messageText) {
   let _message = ''
   if (message) {
     _message = translate(message)
     if (messageText) { // add any additional text
       _message += '<br>' + messageText
     }
   } else if (messageText) {
     _message = messageText
   }
   return (
      <ErrorPopup
        title={translate(title)}
        message={_message}
        dimBackground={true}
        onClose={() => {
          onClose(updateShowState(false, currentState))
        }}
        actionButtonStr={translate('resolve')}
        onActionButton={() => {
          onClickUpdateCards && onClickUpdateCards()
          onClose(updateShowState(false, currentState))
        }}
      />
    );
  }

  /**
   * show either merge error or merge conflict dialog
   * @return {React.JSX.Element}
   */
  function showWarningDialog() {
    if (cardWithError?.show) {
      return showWarningDialog_('merge_error_title', 'merge_error_message', setCardWithError, cardWithError, cardWithError.message)
    } else if (cardWithConflicts?.show) {
      return showWarningDialog_('merge_conflict_title', 'merge_conflict_message', setCardWithConflicts, cardWithConflicts)
    } else if (cardToMerge?.show) { // cardToMerge
      return showWarningDialog_('merge_new_title', 'merge_new_message', setCardToMerge, cardToMerge)
    }
    return null;
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

  const showWarning = cardWithError?.show || cardWithConflicts?.show || cardToMerge?.show;

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
      { showWarning && showWarningDialog() }
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

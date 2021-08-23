import { useEffect, useState } from 'react'
import Backdrop from '@material-ui/core/Backdrop'
import { makeStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { DraggableCard } from 'translation-helps-rcl'
import FeedbackCard from '@components/FeedbackCard'

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}))

// draggable popup for sending feedback
const FeedbackPopup = ({
  owner,
  server,
  branch,
  taArticle,
  languageId,
  selectedQuote,
  scriptureOwner,
  bibleReference,
  supportedBibles,
  currentLayout,
  lastError,
  loggedInUser,
  onClose,
  mainScreenRef,
  open,
}) => {
  const classes = useStyles()
  const [updateBounds, setUpdateBounds] = useState(0)
  const [initCard, setInitCard] = useState(false)

  /**
   * update bounds calculations
   */
  function doUpdateBounds() {
    if (open) {
      setUpdateBounds(updateBounds + 1)
    }
  }

  useEffect(() => {
    doUpdateBounds() // update bounds calculations after render

    if (open) {
      setInitCard(true)
    }
  }, [open])

  const feedbackParams = {
    owner,
    server,
    branch,
    taArticle,
    languageId,
    selectedQuote,
    scriptureOwner,
    bibleReference,
    supportedBibles,
    currentLayout,
    lastError,
    loggedInUser,
    initCard,
    setInitCard,
    open,
  }

  return (
    <Backdrop
      className={classes.backdrop}
      open={open}
    >
      <DraggableCard
        open={open}
        showRawContent
        initialPosition={{ x: 0, y: -10 }}
        workspaceRef={mainScreenRef}
        onClose={onClose}
        content={
          <FeedbackCard
            {...feedbackParams}
          />
        }
      />

    </Backdrop>
  )
}

FeedbackPopup.propTypes = {
  owner: PropTypes.string,
  server: PropTypes.string,
  branch: PropTypes.string,
  taArticle: PropTypes.object,
  languageId: PropTypes.string,
  selectedQuote: PropTypes.object,
  scriptureOwner: PropTypes.string,
  bibleReference: PropTypes.object,
  supportedBibles: PropTypes.array,
  currentLayout: PropTypes.object,
  lastError: PropTypes.object,
  loggedInUser: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  /** Optional, used to make sure draggable card is contained within workspace */
  mainScreenRef: PropTypes.object,
}

export default FeedbackPopup

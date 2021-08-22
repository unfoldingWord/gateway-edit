import { DraggableCard } from 'translation-helps-rcl'
import PropTypes from 'prop-types'
import FeedbackCard from '@components/FeedbackCard'

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
}) => {
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
  }

  return (
    <DraggableCard
      open
      showRawContent
      initialPosition={{ x: 0, y: -60 }}
      workspaceRef={mainScreenRef}
      onClose={onClose}
      content={
        <FeedbackCard
          {...feedbackParams}
        />
      }
    />
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

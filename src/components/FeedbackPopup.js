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
      onClose={onClose}
      content={
        <FeedbackCard
          {...feedbackParams}
        />
      }
    />
  )
}

FeedbackPopup.propTypes = { onClose: PropTypes.func.isRequired }

export default FeedbackPopup

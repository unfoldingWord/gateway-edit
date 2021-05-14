import React from 'react'
import PropTypes from 'prop-types'
import { NETWORK_ERROR, RETRY } from '@common/constants'
import ErrorPopup from '@components/ErrorPopUp'
import SaveIcon from '@material-ui/icons/Save'

export default function NetworkErrorPopup(
  {
    networkError,
    setNetworkError,
    onActionButton,
    onRetry,
    title,
    closeButtonStr,
    onClose,
  }) {
  return (
    <ErrorPopup
      title={title}
      message={networkError.errorMessage}
      closeButtonStr={closeButtonStr}
      onClose={() => {
        onClose && onClose()
        setNetworkError(null)
      }}
      actionButtonStr={onActionButton && networkError.actionButtonText}
      actionStartIcon={networkError.authenticationError ? null : <SaveIcon/>}
      onActionButton={() => onActionButton && onActionButton(networkError)}
      actionButton2Str={!!onRetry && RETRY}
      onActionButton2={() => onRetry && onRetry(networkError)}
    />
  )
}

NetworkErrorPopup.defaultProps = { title: NETWORK_ERROR }

NetworkErrorPopup.propTypes = {
  /** On close event handler */
  onClose: PropTypes.func,
  /** custom title text */
  title: PropTypes.string,
  /** contains details about the networking error - created by processNetworkError() */
  networkError: PropTypes.object,
  /** to close pop up */
  setNetworkError: PropTypes.func,
  /** handler for action button click, if not defined then action button not shown */
  onActionButton: PropTypes.func,
  /** handler for retry button click, if not defined then retry button not shown */
  onRetry: PropTypes.func,
  /** if present, then use this text for the close button */
  closeButtonStr: PropTypes.string,
}

/**
 * PromptDialog Component
 *
 * Synopsis:
 * A reusable confirmation dialog component that provides a standardized interface
 * for confirming user actions throughout the application.
 *
 * Description:
 * This modal dialog presents users with a confirmation prompt before proceeding with
 * potentially important or destructive actions. It features customizable content,
 * title, and button text to handle various confirmation scenarios while maintaining
 * a consistent user experience across the application.
 *
 * Properties:
 * @param {string} content - The main message or question displayed in the dialog body
 * @param {string} noText - Text for the negative/cancel button (optional)
 * @param {boolean} open - Controls the visibility of the dialog
 * @param {Function} onNo - Handler called when the user clicks the negative/cancel button (optional)
 * @param {Function} onYes - Handler called when the user confirms the action
 * @param {string} title - The title displayed at the top of the dialog
 * @param {Function} translate - Translation function for UI text localization
 * @param {string} yesText - Text for the positive/confirmation button
 */

import React from 'react'
import PropTypes from 'prop-types'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

function PromptDialog({
  content,
  noText,
  open,
  onClose,
  onNo,
  onYes,
  title,
  translate,
  yesText
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="reset-warn-dialog"
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        { onNo &&
          <Button onClick={onNo} color="primary">
            {noText}
          </Button>
        }
        <Button onClick={onYes} color="secondary">
          {yesText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// return (
//   <Dialog
//     open={open}
//     onClose={onClose}
//     aria-labelledby="reset-warn-dialog"
//   >
//     <DialogTitle id="form-dialog-title">{translate('warning')}</DialogTitle>
//     <DialogContent>
//       <DialogContentText>
//         {translate('alignments.reset_confirm')}
//       </DialogContentText>
//     </DialogContent>
//     <DialogActions>
//       <Button onClick={onClose} color="primary">
//         {translate('no')}
//       </Button>
//       <Button onClick={onConfirm} color="secondary">
//         {translate('yes')}
//       </Button>
//     </DialogActions>
//   </Dialog>
// )
// }

PromptDialog.propTypes = {
  content: PropTypes.string.isRequired,
  noText: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onNo: PropTypes.func,
  onYes: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  translate: PropTypes.func.isRequired,
  yesText: PropTypes.string.isRequired,
}

export default PromptDialog

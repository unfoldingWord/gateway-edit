import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { DraggableCard } from 'translation-helps-rcl'
import { CANCEL } from '@common/constants'

export default function ErrorPopup(
  {
    actionButtonStr = '',
    actionButtonDefault,
    actionButton2Str = '',
    actionButton2Default,
    actionStartIcon = null,
    closeButtonDefault = true,
    closeButtonStr = CANCEL,
    dimBackground = true,
    hideClose = false,
    showHideFutureWarnings = false,
    onHideFutureWarningsChange,
    id = `error_popup`,
    message,
    onActionButton,
    onActionButton2,
    onClose,
    title,
  }) {
  const [hideFutureWarningsChecked, setHideFutureWarningsChecked] = React.useState(false)

  function getActionButtons() {
    return <>
      {actionButtonStr &&
        <Button
          size='large'
          className='my-3'
          color={actionButtonDefault ? 'primary' : 'default'}
          variant='contained'
          onClick={() => {
            onActionButton && onActionButton()
            onClose && onClose()
          }}
          startIcon={actionStartIcon}
        >
          {actionButtonStr}
        </Button>
      }
      {actionButton2Str &&
        <Button
          size='large'
          className='my-3'
          color={actionButton2Default ? 'primary' : 'default'}
          variant='contained'
          onClick={() => {
            onActionButton2 && onActionButton2()
            onClose && onClose()
          }}
        >
          {actionButton2Str}
        </Button>
      }
    </>
  }

  const title_ =
    <div className='h1 text-xl'> {title} </div>

  const content =
    <div className='flex-col'>
      <div className='h2 flex text-lg my-3 wrap-anywhere'> {message} </div>

      {showHideFutureWarnings &&
        <div className='my-3'>
          <FormControlLabel
            control={
              <Checkbox
                checked={hideFutureWarningsChecked}
                onChange={(_event, checked) => {
                  setHideFutureWarningsChecked(checked)
                  onHideFutureWarningsChange && onHideFutureWarningsChange(checked)
                }}
                color='primary'
              />
            }
            label='Hide future merge warnings'
          />
        </div>
      }

      <div className='flex justify-end space-x-4'>
        { !hideClose &&
        <Button
          size='large'
          color={closeButtonDefault ? 'primary' : 'default'}
          className='my-3'
          variant='contained'
          onClick={onClose}
        >
          {closeButtonStr}
        </Button>
        }
        {getActionButtons()}
      </div>
    </div>

  return (
    <DraggableCard
      open={true}
      title={title_}
      content={content}
      showRawContent={true}
      dimBackground={dimBackground}
      id={id}
      onClose={onClose}
    />
  )
}

ErrorPopup.propTypes = {
  /** On close event handler */
  onClose: PropTypes.func,
  /** title Content */
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  /** message Content */
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  /** optional identifier */
  id: PropTypes.string,
  /** if present, then show action button */
  actionButtonStr: PropTypes.string,
  /** callback if action button clicked */
  onActionButton: PropTypes.func,
  /** if given then attach icon to action button */
  actionStartIcon: PropTypes.object,
  /** if true then make action button the default */
  actionButtonDefault: PropTypes.bool,
  /** if present, then show second action button */
  actionButton2Str: PropTypes.string,
  /** callback if second action button clicked */
  onActionButton2: PropTypes.func,
  /** if true then make action button 2 the default */
  actionButton2Default: PropTypes.bool,
  /** if present, then use this text for the close button */
  closeButtonStr: PropTypes.string,
  /** if true then make close button the default */
  closeButtonDefault: PropTypes.bool,
  /** if true, don't show close button */
  hideClose: PropTypes.bool,
  /** turn off or on background dimming, default is on */
  dimBackground: PropTypes.bool,
  /** hide the future warnings checkbox entirely */
  showHideFutureWarnings: PropTypes.bool,
  /** callback for checkbox state changes */
  onHideFutureWarningsChange: PropTypes.func,
}

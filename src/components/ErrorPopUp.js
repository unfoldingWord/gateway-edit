import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import SaveIcon from '@material-ui/icons/Save'
import DraggableCard from 'translation-helps-rcl/dist/components/DraggableCard'

export default function ErrorPopup(
  {
    onClose,
    title,
    message,
    id,
    actionButtonStr,
    onActionButton,
  }) {
  function getActionButton() {
    return <>
      {actionButtonStr ?
        <Button
          size='large'
          className='my-3'
          variant='contained'
          onClick={() => {
            onActionButton && onActionButton()
            onClose && onClose()
          }}
          startIcon={<SaveIcon/>}
        >
          {actionButtonStr}
        </Button> :
        null
      }
    </>
  }

  const title_ =
    <div className='h1 text-xl'> {title} </div>

  const content =
    <div className='flex-col'>
      <div className='h2 flex text-lg my-3'> {message} </div>
      <div className='flex justify-end space-x-4'>
        <Button
          size='large'
          color='primary'
          className='my-3'
          variant='contained'
          onClick={onClose}
        >
          Cancel
        </Button>
        {getActionButton()}
      </div>
    </div>

  return (
    <DraggableCard
      open={true}
      title={title_}
      content={content}
      showRawContent={true}
      id={id}
      onClose={onClose}
    />
  )
}

ErrorPopup.defaultProps = {
  id: `error_popup`,
  actionButtonStr: '',
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
  // ** if present, then show user button */
  actionButtonStr: PropTypes.string,
  //** callback if action button clicked */
  onActionButton: PropTypes.func,
}

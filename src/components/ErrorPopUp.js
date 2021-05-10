import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import DraggableCard from 'translation-helps-rcl/dist/components/DraggableCard'

export default function ErrorPopup(
  {
    onClose,
    title,
    message,
    id,
    actionButtonStr,
    onActionButton,
    actionStartIcon,
    actionButton2Str,
    onActionButton2,
  }) {
  function getActionButtons() {
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
          startIcon={actionStartIcon}
        >
          {actionButtonStr}
        </Button> :
        null
      }
      {actionButton2Str ?
        <Button
          size='large'
          className='my-3'
          variant='contained'
          onClick={() => {
            onActionButton2 && onActionButton2()
            onClose && onClose()
          }}
        >
          {actionButton2Str}
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
        {getActionButtons()}
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
  startIcon: null,
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
  /** if present, then show second action button */
  actionButton2Str: PropTypes.string,
  /** callback if second action button clicked */
  onActionButton2: PropTypes.func,
}

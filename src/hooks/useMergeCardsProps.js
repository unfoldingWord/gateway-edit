import { useEffect, useState, useMemo } from 'react'

export default function useMergeCardsProps({
  mergeStatusForCards = {},
  isLoading: _isLoading = false,
} = {}) {
  const [isLoading, setIsLoading] = useState(_isLoading)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  const loadingProps = { color: loadingMerge ? 'primary' : 'secondary' }

  // TODO
  // Figure out the status of the dialogs based on merge status

  const onClick = () => {
    if (blocked | !pending) return setIsErrorDialogOpen(true)
    setIsMessageDialogOpen(true)
  }

  const onCloseErrorDialog = () => {
    setIsErrorDialogOpen(false)
  }

  const onCancel = () => {
    setIsMessageDialogOpen(false)
  }

  // Maybe this updates each card's update status?
  const onSubmit = description => {
    setIsLoading(true)
    // TODO
    // FOR EACH CARD...
    // if (callMergeUserBranch(description)) {
    //   yay it worked
    // } else {
    //   ERROR
    // }
  }

  return {
    isLoading,
    onClick,
    onSubmit,
    onCancel,
    onCloseErrorDialog,
    isMessageDialogOpen,
    isErrorDialogOpen,
    dialogMessage,
    dialogLink,
    dialogLinkTooltip,
    pending,
    blocked,
    loadingProps
  }
}

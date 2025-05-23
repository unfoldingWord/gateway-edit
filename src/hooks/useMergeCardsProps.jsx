import { useSnackbar } from 'notistack'
import { useState, useEffect, useMemo } from 'react'

export default function useMergeCardsProps({ mergeStatusForCards = {}, isMerging } = {}) {
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    if (!isMerging) {
      setIsMessageDialogOpen(false)
    }
  }, [isMerging])

  const loadingProps = { color: 'primary' }

  const getMergeGroupingFromStatus = mergeStatus => {
    const { conflict, mergeNeeded, error, message } = mergeStatus

    if (conflict) return 'cardsWithConflicts'

    if (error) {
      if (message.includes('does not exist')) return 'cardsWithNoUserBranch'
      if (message.includes('nothing to commit')) return 'cardsWithNoChanges'
      return 'cardsWithError'
    }
    if (!mergeNeeded) return 'cardsWithNoMergeNeeded'
    return 'cardsToMerge'
  }

  const groupCardByMergability = (prevMergeCardState, cardId) => {
    const mergeToMasterStatus = mergeStatusForCards[cardId].mergeToMaster
    const mergeGrouping = getMergeGroupingFromStatus(mergeToMasterStatus)
    return {...prevMergeCardState, [mergeGrouping]: [...prevMergeCardState[mergeGrouping], cardId]}
  }

  const initialCardMergeGroupings = {
    cardsWithConflicts: [],
    cardsWithNoUserBranch: [],
    cardsWithError: [],
    cardsWithNoChanges: [],
    cardsWithNoMergeNeeded: [],
    cardsToMerge: []
  }

  const cardMergeGroupings = useMemo(() => {
    if (mergeStatusForCards) {
      return Object.keys(mergeStatusForCards).reduce(groupCardByMergability, initialCardMergeGroupings)
    }
  }, [mergeStatusForCards])

  const {
    cardsWithConflicts,
    cardsWithNoUserBranch,
    cardsWithError,
    cardsWithNoChanges,
    cardsWithNoMergeNeeded,
    cardsToMerge
  } = cardMergeGroupings ? cardMergeGroupings : {}
  const pending = cardsToMerge?.length
  const blocked = !cardsToMerge?.length && !cardsWithNoMergeNeeded?.length

  const getCardNameFromId = cardId => {
    return mergeStatusForCards[cardId].title
  }

  const renderCardNamesFromIds = cardIds => {
    const renderAsList = (prevListString, cardName) => {
      if (prevListString?.length) return `${prevListString}, ${cardName}`
      return cardName
    }

    if (cardIds?.length === 0) return "None"
    return cardIds?.map(getCardNameFromId).reduce(renderAsList, "")
  }

  const { message: dialogMessage, title: dialogTitle } = useMemo(() => {
    const updateStatusMessage = "Some of your changes have not been saved because of errors or conflicts."

    const message =
    <>
      <p><strong>{updateStatusMessage} Further status displayed below...</strong></p>
      <p><strong>Cards With Conflicts:</strong> {renderCardNamesFromIds(cardsWithConflicts)}</p>
      <p><strong>Cards With Errors:</strong> {renderCardNamesFromIds(cardsWithError)}</p>
      <p>
        <strong>Cards With No Changes To Save: </strong>
        {renderCardNamesFromIds([...cardsWithNoUserBranch, ...cardsWithNoMergeNeeded])}
      </p>
      <p>
        <strong>Cards Where Changes Are Same as Source: </strong>
        {renderCardNamesFromIds(cardsWithNoChanges)}
      </p>
    </>

    return {
      title: "Cards Sync Feedback",
      message,
    };
  }, [cardMergeGroupings])

  const onClick = () => {
    if (blocked || !pending) return setIsErrorDialogOpen(true)
    setIsMessageDialogOpen(true)
  }

  const onCloseErrorDialog = () => {
    setIsErrorDialogOpen(false)
  }

  const onCancel = () => {
    setIsMessageDialogOpen(false)
  }

  const syncMergeableCards = async (mergeableCardIds, description) => {
    const syncPromises = mergeableCardIds.map(cardId => {
      const { mergeToMasterFromUserBranch } = mergeStatusForCards[cardId]
      return mergeToMasterFromUserBranch(description)
    })

    const responses = await Promise.all(syncPromises)
    const wasMergeSuccessful = responses.every(response =>
      response.success && response.message === ""
    )
    if (!wasMergeSuccessful) return setIsErrorDialogOpen(true)

    enqueueSnackbar('Merge successful', { variant: 'success' })
  }

  const onSubmit = ({ mergeableCardIds, description }) => {
    console.log({ cardsToMerge, mergeableCardIds })
    syncMergeableCards(mergeableCardIds, description)
  }

  return {
    onClick,
    onSubmit,
    onCancel,
    onCloseErrorDialog,
    isMessageDialogOpen,
    isErrorDialogOpen,
    dialogMessage,
    dialogTitle,
    pending,
    blocked,
    loadingProps,
    cardMergeGroupings,
    cardsToMerge,
  }
}

// cardsToMerge=[ult, ust]

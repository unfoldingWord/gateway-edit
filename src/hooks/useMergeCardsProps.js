import { useState, useMemo } from 'react'

export default function useMergeCardsProps({ mergeStatusForCards = {} } = {}) {
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  const loadingProps = { color: 'primary' }

  const getMergeGroupingFromStatus = mergeStatus => {
    const { conflict, mergeNeeded, error, message } = mergeStatus

    if (conflict) return 'cardsWithConflicts'
    if (error) {
      if (message.includes('does not exist')) return 'cardsWithNoUserBranch'
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
    cardsWithNoMergeNeeded,
    cardsToMerge
  } = cardMergeGroupings ? cardMergeGroupings : {}
  const pending = cardsToMerge?.length
  const blocked = !cardsToMerge?.length && !cardsWithNoMergeNeeded?.length

  const getCardNameFromId = cardId => {
    if (cardId === 'tw') return "Translation Words Article"
    if (cardId === 'ult') return "Unfolding Word Literal Text"
    if (cardId === 'ust') return "Unfolding Word Simplified Text"
    if (cardId === 'twl') return "Translation Word List"
    if (cardId === 'tn') return "Translation Notes"
    if (cardId === 'ta') return "Translation Academy"
    if (cardId === 'tq') return "Translation Questions"
    return cardId
  }

  const renderCardNamesFromIds = cardIds => {
    const renderAsList = (prevListString, cardName) => {
      if (prevListString?.length) return `${prevListString}, ${cardName}`
      return cardName
    }

    if (cardIds?.length === 0) return "None"
    return cardIds.map(getCardNameFromId).reduce(renderAsList, "")
  }

  const { message: dialogMessage, title: dialogTitle } = useMemo(() => {
    let updateStatusMessage;
    if (cardsToMerge?.length) {
      updateStatusMessage = "Some of your changes have been saved to your team's work, while others have not."
    } else {
      updateStatusMessage = "None of your changes have been saved to your team's work."
    }

    const message =
    <>
      <p><strong>{updateStatusMessage} Card merge status displayed below...</strong></p>
      <p><strong>Cards With Conflicts:</strong> {renderCardNamesFromIds(cardsWithConflicts)}</p>
      <p><strong>Cards With Errors:</strong> {renderCardNamesFromIds(cardsWithError)}</p>
      <p>
        <strong>Cards With No Changes To Save: </strong>
        {renderCardNamesFromIds([...cardsWithNoUserBranch, ...cardsWithNoMergeNeeded])}
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
    await Promise.all(syncPromises)
    if (cardsWithConflicts?.length || cardsWithError?.length || !cardsToMerge?.length) {
      setIsMessageDialogOpen(false)
      return setIsErrorDialogOpen(true)
    }
  }

  const onSubmit = description => {
    syncMergeableCards(cardsToMerge, description)

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
    loadingProps
  }
}

import { useMemo, useState } from 'react'

export default function useUpdateCardsProps({ mergeStatusForCards } = {}) {
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

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

  const groupCardByMergability = (prevUpdateCardState, cardId) => {
    const mergeFromMasterStatus = mergeStatusForCards[cardId].mergeFromMaster
    const mergeGrouping = getMergeGroupingFromStatus(mergeFromMasterStatus)
    return {...prevUpdateCardState, [mergeGrouping]: [...prevUpdateCardState[mergeGrouping], cardId]}
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
      updateStatusMessage = "Some cards have succesfully updated, while others have not."
    } else {
      updateStatusMessage = "No cards have successfully updated with your team's work."
    }

    const message =
    <>
      <p><strong>{updateStatusMessage} Card update status displayed below...</strong></p>
      <p><strong>Cards With Conflicts:</strong> {renderCardNamesFromIds(cardsWithConflicts)}</p>
      <p><strong>Cards With Errors:</strong> {renderCardNamesFromIds(cardsWithError)}</p>
      <p>
        <strong>Cards With No Updates To Load: </strong>
        {renderCardNamesFromIds([...cardsWithNoUserBranch, ...cardsWithNoMergeNeeded])}
      </p>
    </>

    return {
      title: "No Cards Updated",
      message,
    };
  }, [cardMergeGroupings])

  const onCloseErrorDialog = () => {
    setIsErrorDialogOpen(false)
  }

  const updateMergeableCards = async mergeableCardIds => {
    const updatePromises = mergeableCardIds.map(cardId => {
      const { mergeFromMasterIntoUserBranch } = mergeStatusForCards[cardId]
      return mergeFromMasterIntoUserBranch()
    })
    await Promise.all(updatePromises)
    if (cardsWithConflicts?.length || cardsWithError?.length || !cardsToMerge?.length) {
      return setIsErrorDialogOpen(true)
    }
  }

  const onClick = () => {
    updateMergeableCards(cardsToMerge)
  }

  return {
    onClick,
    cardMergeGroupings,
    isErrorDialogOpen,
    onCloseErrorDialog,
    dialogMessage,
    dialogTitle,
    pending,
    blocked
  }
}

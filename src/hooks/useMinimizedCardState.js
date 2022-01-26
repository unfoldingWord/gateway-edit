import { useEffect , useState } from 'react'

export default function useMinimizedCardState({
  currentLayout,
  setCurrentLayout,
  cards: initialCards,
}) {
  const [cards] = useState(initialCards)
  const [minimizedCardIds, setMinimizedCardId] = useState([])
  const [oldCurrentLayout, setOldCurrentLayout] = useState(null)
  // const [minimizedCards, setMinimizedCards] = useState([])
  const minimizedCards = cards.filter((card) => minimizedCardIds.includes(card.id))
  // Filter out the minimized cards which are included in the minimizedCardIds array
  let visibleCards = cards.filter((card) => !minimizedCardIds.includes(card.id))

  // Reset resource card layout on unmount.
  // useEffect(() => function cleanup() {
  //   if (minimizedCardIds.length > 0) {
  //     console.info('On unmount')
  //     setCurrentLayout(null)
  //   }
  // })

  // useEffect(() => {
  //   const newMinimizedCards = cards.filter((card) => minimizedCardIds.includes(card.id))
  //   setMinimizedCards(newMinimizedCards)
  // }, [minimizedCardIds, cards])

  /**
   * Minimizes the card for the given card id.
   * @param {string} id - Id title of the card to be minimized.
   */
  const minimizeCard = (id) => {
    console.log({ id })
    const updatedLayout = Object.assign({}, currentLayout)
    setOldCurrentLayout(Object.assign(updatedLayout, oldCurrentLayout))

    if (!minimizedCardIds.includes(id)) {
      console.log([...minimizedCardIds, id])
      setMinimizedCardId([...minimizedCardIds, id])
      // setCurrentLayout(null)
    }
  }

  /**
   * Maximizes the card for the given card id.
   * @param {string} id - Id title of the card to be minimized.
   */
  const maximizeCard = (id) => {
    console.log({ id })

    if (minimizedCardIds.includes(id)) {
      console.log('inside')
      const newMinimizedCardIds = minimizedCardIds.filter(minimizedCardId => minimizedCardId !== id)
      console.log({ newMinimizedCardIds })
      setMinimizedCardId(newMinimizedCardIds)
      // setCurrentLayout(null)
    }

    // TODO: mAYBE? IT WOKRED FOR NOW
    setCurrentLayout(oldCurrentLayout)
  }

  // Add the minimizeCard method to each visible card object
  visibleCards = visibleCards.map((card) => {
    card.onMinimize = minimizeCard

    return card
  })

  console.log({
    oldCurrentLayout, currentLayout, minimizedCardIds, visibleCards,
  })

  return {
    visibleCards,
    minimizeCard,
    maximizeCard,
    minimizedCards,
    minimizedCardIds,
  }
}

import { useState } from 'react'

export default function useMinimizedCardState({
  currentLayout,
  setCurrentLayout,
  useUserLocalStorage,
  cards: initialCards = [],
}) {
  const [cards] = useState(initialCards)
  const [minimizedCardIds, setMinimizedCardId] = useUserLocalStorage('minimizedCardIds', [])
  // The oldCurrentLayout is the initial layout when the last card was minimized. This is useful to gracefully restore the card to its initial layout.
  const [oldCurrentLayout, setOldCurrentLayout] = useUserLocalStorage('oldCurrentLayout', null)
  const minimizedCards = cards.filter((card) => minimizedCardIds.includes(card.id))
  // Filter out the minimized cards which are included in the minimizedCardIds array
  const visibleCards = cards.filter((card) => !minimizedCardIds.includes(card.id))

  /**
   * Minimizes the card for the given card id.
   * @param {string} id - Id title of the card to be minimized.
   */
  const minimizeCard = (id) => {
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
    if (minimizedCardIds.includes(id)) {
      const newMinimizedCardIds = minimizedCardIds.filter(minimizedCardId => minimizedCardId !== id)
      setMinimizedCardId(newMinimizedCardIds)
      // setCurrentLayout(null)
    }

    setCurrentLayout(oldCurrentLayout)
  }

  return {
    // Adding the minimizeCard method to each visible card
    visibleCards: visibleCards.map((card) => {
      card.onMinimize = minimizeCard

      return card
    }),
    minimizeCard,
    maximizeCard,
    minimizedCards,
    minimizedCardIds,
  }
}

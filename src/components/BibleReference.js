import { useContext } from 'react'
import BibleReference, { useBibleReference } from 'bible-reference-rcl'
import { ReferenceContext } from '@context/ReferenceContext'

function BibleReferenceComponent(props) {
  const {
    state: {
      bibleReference: { bookId, chapter, verse },
    },
    actions: { onReferenceChange },
  } = useContext(ReferenceContext)

  const { state, actions } = useBibleReference({
    initialBook: bookId,
    initialChapter: chapter,
    initialVerse: verse,
    onChange: onReferenceChange,
  })

  return (
    <BibleReference
      status={state}
      actions={actions}
      style={{ color: '#ffffff' }}
    />
  )
}

export default BibleReferenceComponent

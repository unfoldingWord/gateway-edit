import React, { useContext } from 'react'
import useEffect from 'use-deep-compare-effect'
import BibleReference, { useBibleReference } from 'bible-reference-rcl'
import { ReferenceContext } from '@context/ReferenceContext'

function BibleReferenceComponent(props) {
  const {
    state: {
      bibleReference: { bookId, chapter, verse },
      supportedBibles,
    },
    actions: { onReferenceChange },
  } = useContext(ReferenceContext)

  const { state, actions } = useBibleReference({
    initialBook: bookId,
    initialChapter: chapter,
    initialVerse: verse,
    onChange: onReferenceChange,
  })

  useEffect(() => {
    if (supportedBibles?.length) {
      console.log(`BibleReferenceComponent - supportedBibles changed, applying ${JSON.stringify(supportedBibles)}`)
      actions.applyBooksFilter(supportedBibles)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportedBibles])

  return (
    <BibleReference
      status={state}
      actions={actions}
      style={{ color: '#ffffff' }}
    />
  )
}

export default BibleReferenceComponent

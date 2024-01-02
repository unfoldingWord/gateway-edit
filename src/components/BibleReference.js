import React, { useContext } from 'react'
import useEffect from 'use-deep-compare-effect'
import BibleReference, { useBibleReference } from 'bible-reference-rcl'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { StoreContext } from '@context/StoreContext'

const useStyles = makeStyles((theme) => ({
  underline: {
    '&:hover:not(.Mui-disabled):before': { borderBottom: '2px solid white' },
    '&:before': { borderBottom: '1px solid white' },
    '&:after': { borderBottom: '2px solid white' },
  },
}))

function BibleReferenceComponent(props) {
  const classes = useStyles()
  const {
    state: {
      bibleReference: {
        bookId, chapter, verse,
      },
      supportedBibles,
      obsSupport,
    },
    actions: { onReferenceChange, checkUnsavedChanges },
  } = useContext(StoreContext)

  const { state, actions } = useBibleReference({
    initialBook: bookId,
    initialChapter: chapter,
    initialVerse: verse,
    onChange: onReferenceChange,
    addOBS: obsSupport,
    onPreChange: () => checkUnsavedChanges(),
    addChapterFront: 'front',
  })

  useEffect(() => {
    if ((state.bookId !== bookId) || (state.chapter !== chapter) || (state.verse !== verse)) {
      // update reference if external change (such as user log in causing saved reference to be loaded)
      actions.goToBookChapterVerse(bookId, chapter, verse)
    }
  }, [{
    bookId, chapter, verse,
  }])

  useEffect(() => {
    if (supportedBibles?.length) {
      let supportedBibles_ = supportedBibles

      if (obsSupport) { // make sure obs is in list
        if (!supportedBibles.includes('obs')) {
          supportedBibles_ = [
            ...supportedBibles,
            'obs',
          ]
        }
      }
      actions.applyBooksFilter(supportedBibles_)
    } else if (obsSupport) { // if only obs support
      actions.applyBooksFilter(['obs'])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportedBibles, obsSupport])

  return (
    <BibleReference
      status={state}
      actions={actions}
      inputProps={{ classes }}
      style={{ color: '#ffffff' }}
    />
  )
}

export default BibleReferenceComponent

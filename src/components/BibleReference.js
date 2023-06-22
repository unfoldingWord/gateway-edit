import React, { useContext } from 'react'
import useEffect from 'use-deep-compare-effect'
import BibleReference, { useBibleReference } from 'bible-reference-rcl'
import makeStyles from '@material-ui/core/styles/makeStyles'
import { StoreContext } from '@context/StoreContext'
import { getSupportedBooksFromTSV } from '@utils/bible'

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
      filter,
      supportedBibles,
    },
    actions: {
      checkUnsavedChanges,
      onReferenceChange,
      setFilter,
    },
  } = useContext(StoreContext)

  const { state, actions } = useBibleReference({
    initialBook: bookId,
    initialChapter: chapter,
    initialVerse: verse,
    onChange: onReferenceChange,
    onPreChange: () => checkUnsavedChanges(),
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
      actions.applyBooksFilter(supportedBibles)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportedBibles])

  React.useEffect(() => { // if bible filter changes, update bible-reference-rcl
    if (filter?.enabled) { // applying new filter
      if (!filter.filteredBooks && filter.rawTSV) {
        const { supportedBooks, config } = getSupportedBooksFromTSV(filter.rawTSV)
        actions.setBookChapterVerses(supportedBooks)
        console.log('filter applied', { newBCV: supportedBooks, filterArray: filter })
        setFilter({
          filteredBooks: supportedBooks,
          config,
        })
      }
    } else if (!filter?.enabled && filter?.filteredBooks) { // clearing previous filter
      actions.setBookChapterVerses(null)
      console.log('filter removed')
      setFilter({ filteredBooks: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

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

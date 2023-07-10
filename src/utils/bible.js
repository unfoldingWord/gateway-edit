import { getFilterFromTSV } from '@utils/tsv'
import { BIBLES_ABBRV_INDEX } from '../common/BooksOfTheBible'

function zeroAdjustLength(text, len) {
  let parts = text.split('-')
  text = parts[0]

  while (text.length < len) {
    text = '0' + text
  }
  parts[0] = text
  return parts.join('-')
}

function splitBookAndRef(ref) {
  const [bookId, ref_] = (ref || '').trim().split(' ')
  return { bookId, ref_ }
}

function splitChapterVerse(ref_) {
  const [chapter, verse] = ref_.split(':')
  return { chapter, verse }
}

function normalizeRef(ref) {
  const { bookId, ref_ } = splitBookAndRef(ref)

  if ( bookId && ref_ ) {
    let { chapter, verse } = splitChapterVerse(ref_)

    if (chapter && verse) {
      chapter = zeroAdjustLength(chapter, 3)
      verse = zeroAdjustLength(verse, 3)
      const bookNum = zeroAdjustLength(BIBLES_ABBRV_INDEX[bookId] || '', 3)
      return `${bookNum}_${chapter}_${verse}`
    }
  }
  return null
}

export function bibleRefSort(a, b) { // sorts by true book/chapter/verse order
  const akey = normalizeRef(a)
  const bkey = normalizeRef(b)
  // eslint-disable-next-line no-nested-ternary
  return akey < bkey ? -1 : akey > bkey ? 1 : 0
}

export function getSupportedBooksFromTSV(tsv) {
  const { refs, items } = getFilterFromTSV(tsv)
  let config = items?.length && items[0]?.Configuration
  config = config && JSON.parse(config)
  const supportedBooks = convertRefsToSupportedBooks(refs) // convert from array of references to structured object
  return { config, supportedBooks }
}

/**
 * take list of book/chapter/verses and create a structured object used by bible-reference-rcl
 * @param refs - list in format such as ['gen 1:1', ...]
 * @return {{}} - structure such as {gen: {1: ['1', '2', ...]}}}
 */
export function convertRefsToSupportedBooks(refs) {
  const supportedBooks = {}

  for (const ref of refs) {
    const { bookId, ref_ } = splitBookAndRef(ref)
    let chapters = supportedBooks[bookId]

    if (!chapters) { // if we don't yet have book then add
      chapters = { }
      supportedBooks[bookId] = chapters
    }

    const { chapter, verse } = splitChapterVerse(ref_)
    let verses = chapters[chapter]

    if (!verses) {
      verses = []
      chapters[chapter] = verses
    }

    if (!verses.includes(verse)) {
      verses.push(verse)
    }
  }

  return supportedBooks
}


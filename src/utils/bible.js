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

export function refsToObject(refs) {
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


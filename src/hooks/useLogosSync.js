import { useEffect, useRef } from 'react'

/**
 * Maps USFM book IDs (used throughout gateway-edit) to Logos Bible Software
 * abbreviations for use in logosref: URIs.
 * Format: logosref:Bible.[LogosAbbr][Chapter].[Verse]
 * e.g.   logosref:Bible.La3.5
 */
const LOGOS_BOOK_MAP = {
  // Old Testament
  gen: 'Ge',  exo: 'Ex',   lev: 'Le',   num: 'Nu',   deu: 'Dt',
  jos: 'Jos', jdg: 'Judg', rut: 'Ru',
  '1sa': '1Sa', '2sa': '2Sa', '1ki': '1Ki', '2ki': '2Ki',
  '1ch': '1Ch', '2ch': '2Ch',
  ezr: 'Ezra', neh: 'Ne',  est: 'Es',   job: 'Job',
  psa: 'Ps',  pro: 'Pr',   ecc: 'Ec',   sng: 'Song',
  isa: 'Is',  jer: 'Je',   lam: 'La',   ezk: 'Eze',  dan: 'Da',
  hos: 'Ho',  jol: 'Joe',  amo: 'Am',   oba: 'Ob',   jon: 'Jon',
  mic: 'Mic', nam: 'Na',   hab: 'Hab',  zep: 'Zep',  hag: 'Hag',
  zec: 'Zec', mal: 'Mal',
  // New Testament
  mat: 'Mt',  mrk: 'Mk',   luk: 'Lk',   jhn: 'Jn',   act: 'Ac',
  rom: 'Ro',
  '1co': '1Co', '2co': '2Co',
  gal: 'Ga',  eph: 'Eph',  php: 'Php',  col: 'Col',
  '1th': '1Th', '2th': '2Th', '1ti': '1Ti', '2ti': '2Ti',
  tit: 'Ti',  phm: 'Phm',  heb: 'Heb',  jas: 'Jas',
  '1pe': '1Pe', '2pe': '2Pe',
  '1jn': '1Jn', '2jn': '2Jn', '3jn': '3Jn',
  jud: 'Jude', rev: 'Re',
}

/**
 * Build a logosref: URI for the given reference.
 * @param {string} bookId  USFM book ID (e.g. 'lam')
 * @param {string|number} chapter
 * @param {string|number} verse
 * @returns {string}  e.g. 'logosref:Bible.La3.5'
 */
export function buildLogosUri(bookId, chapter, verse) {
  const abbr = LOGOS_BOOK_MAP[bookId?.toLowerCase()] ?? bookId
  return `logosref:Bible.${abbr}${chapter}.${verse}`
}

/**
 * When `enabled` is true, fires a logosref: URI into a hidden iframe whenever
 * bookId/chapter/verse changes, causing Logos Bible Software to follow along.
 *
 * The iframe approach lets the browser handle the protocol handoff silently
 * after the user grants the one-time "Allow this site to open Logos?" prompt.
 * Users without Logos installed are unaffected — the iframe load simply fails.
 *
 * @param {object} params
 * @param {string}  params.bookId   USFM book ID
 * @param {string}  params.chapter
 * @param {string}  params.verse
 * @param {boolean} params.enabled  Controlled by the Logos Sync toggle
 */
export default function useLogosSync({ bookId, chapter, verse, enabled }) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!enabled || !bookId) return

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const uri = buildLogosUri(bookId, chapter, verse)
      let frame = document.getElementById('logos-sync-frame')
      if (!frame) {
        frame = document.createElement('iframe')
        frame.id = 'logos-sync-frame'
        frame.style.cssText =
          'position:fixed;width:1px;height:1px;top:-999px;left:-999px;border:none;'
        document.body.appendChild(frame)
      }
      frame.src = uri
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [bookId, chapter, verse, enabled])
}

import { useEffect, useState } from 'react'
import * as isEqual from 'deep-equal'
import { getFilesFromRepoZip, useRepository } from 'gitea-react-toolkit'
import { core } from 'scripture-resources-rcl'
import { isNT } from '@common/BooksOfTheBible'
import { delay } from '@utils/resources'
import {
  extractGlossesFromRepoZip,
  fetchFromGlossesStore,
  initLexicon,
  saveToGlossesStore,
} from '@utils/lexiconHelpers'

export default function useLexicon({
  bookId,
  languageId,
  server,
}) {
  const [repository, setRepository] = useState(null)
  const [lexCacheInit, setLexCacheInit] = useState(false)
  const [lexiconGlosses, setLexiconGlosses] = useState(null)
  const [fetchingLexicon, setFetchingLexicon] = useState(false)
  const [fetchingGlosses, setFetchingGlosses] = useState(false)
  const [greekLexConfig, setGreekLexConfig] = useState(null)
  const [hebrewLexConfig, setHebrewLexConfig] = useState(null)
  const [strongsNumbersInVerse, setStrongsNumbersInVerse] = useState(null)

  const isNT_ = isNT(bookId)

  const origlangLexConfig = isNT_ ? greekLexConfig : hebrewLexConfig
  const lexRepoName = origlangLexConfig ? `${origlangLexConfig.languageId}_${origlangLexConfig.resourceId}` : null
  const lexRepoFullName = origlangLexConfig ? `${origlangLexConfig.owner}/${lexRepoName}` : null
  const lexRepoParams = {
    full_name: lexRepoFullName,
    branch: origlangLexConfig?.ref,
    config: origlangLexConfig,
    repository,
    onRepository: onRepository,
  }
  const lexiconProps = useRepository(lexRepoParams)

  useEffect(() => {
    console.log(`useLexicon: bible ${bookId} changed testament ${isNT_}`)
    setRepository(null) // clear lexicon repo so it's reloaded after testament change
    setStrongsNumbersInVerse(null)
    setLexiconGlosses(null)
    setLexCacheInit(false)
  }, [isNT_])

  /**
   * callback function for when useRepository has loaded repo
   * @param repo
   */
  function onRepository(repo) {
    if ( repo?.branch && (repo?.html_url !== repository?.html_url)) {
      console.log(`useLexicon.onRepository():`, repo)
      setRepository(repo)
    }
  }

  /**
   * external function to load lexicon from cached lexicon
   * @param {string} lexiconId - lexicon to search (ugl or uhl)
   * @param {string|number} entryId - numerical part of the strongs number (e.g. '00005')
   * @return {*}
   */
  function getLexiconData(lexiconId, entryId) {
    if (lexiconGlosses && Object.keys(lexiconGlosses).length && entryId) {
      const lexicon = lexiconGlosses[entryId.toString()]
      return { [lexiconId]: { [entryId]: lexicon } }
    } else {
      // console.log(`getLexiconData: gloss not loaded for ${entryId}`)
    }
    return null
  }

  /**
   * save updated lexicon words in state and in indexDB
   * @param newLexiconGlosses
   * @return {Promise<void>}
   */
  async function updateLexiconGlosses(newLexiconGlosses) {
    setLexiconGlosses(newLexiconGlosses)
    await saveToGlossesStore(getGlossesCachePath(), newLexiconGlosses)
  }

  /**
   * called to prefetch all the lexicon data for a verse
   * @param {object[]} verseObjects
   * @param {string} languageId
   * @return {Promise}
   */
  async function fetchGlossesForVerse(verseObjects, languageId) {
    if (origlangLexConfig?.origLangId !== languageId) {
      return
    }

    if (origlangLexConfig && verseObjects?.length && !fetchingGlosses) {
      console.log(`fetchGlossesForVerse - language ${languageId}, ${verseObjects?.length} verseObjects`)
      const wordObjects = core.getWordObjects(verseObjects)

      if (wordObjects?.length) {
        const strongs = core.getStrongsList(wordObjects)

        if (strongs?.length && !isEqual(strongs, strongsNumbersInVerse)) {
          if (lexiconGlosses && Object.keys(lexiconGlosses).length) {
            console.log(`fetchGlossesForVerse - loading strongs numbers`)
            await fetchGlossesForStrongsNumbers(strongs)
          } else { // lexicon words not loaded, save strongs list for later
            setStrongsNumbersInVerse(strongs)
          }
        }
      }
    }
  }

  async function getFilesFromCachedLexicon() {
    const files = await getFilesFromRepoZip({
      owner: origlangLexConfig.owner,
      repo: lexRepoName,
      branch: origlangLexConfig.ref,
      config: { server: origlangLexConfig.server },
    })
    return files
  }

  /**
   * used to preload glosses for a list of strongs numbers (useful to do as verse is loaded)
   * @param {array} strongs
   * @return {Promise<void>}
   */
  async function fetchGlossesForStrongsNumbers(strongs) {
    if (strongs?.length && !fetchingGlosses && origlangLexConfig) {
      setFetchingGlosses(true)
      let newLexiconWords = (await fetchFromGlossesStore(getGlossesCachePath())) || {}
      console.log(`fetchGlossesForStrongsNumber: extracting strongs list length ${strongs.length}, already extracted word length ${Object.keys(newLexiconWords).length}`)
      const files = await getFilesFromCachedLexicon()
      let modified = await extractGlossesFromRepoZip(lexRepoName, origlangLexConfig, strongs, newLexiconWords, files)

      if (modified) {
        await updateLexiconGlosses(newLexiconWords)
        console.log('fetchGlossesForStrongsNumbers: lexicon words updated, length', Object.keys(newLexiconWords).length)
      } else {
        setLexiconGlosses(newLexiconWords)
      }

      console.log('fetchGlossesForStrongsNumbers: new word list length', strongs?.length)
      setStrongsNumbersInVerse(strongs)
      setFetchingGlosses(false)
    }
  }

  async function unzipFileFromCachedLexicon(filename) {
    const filePath = `${origlangLexConfig.lexiconPath}/${filename}`
    const file = await lexiconProps?.actions?.fileFromZip(filePath)
    return file
  }

  async function getGlossFromCachedLexicon(strongs) {
    const filename = `${strongs}.json`
    const file = await unzipFileFromCachedLexicon(filename)
    return file
  }

  async function isLexiconRepoCached() {
    const strongs = 1
    const file = await getGlossFromCachedLexicon(strongs)
    return !!file
  }

  /**
   * find best fit lexicon repo for given languageId, testament, and owner
   * @param {boolean} isNT
   * @return {Promise<void>}
   */
  async function initLexiconForTestament(isNT) {
    const LexOwner = 'test_org'
    const branch = 'master'
    const setLexicon = isNT ? setGreekLexConfig : setHebrewLexConfig
    await initLexicon(languageId, server, LexOwner, branch, setLexicon, isNT)
  }

  useEffect(() => {
    /**
     * find best fit lexicon repos for both testaments of given languageId and owner
     * @return {Promise<void>}
     */
    async function getLexicons() {
      if (languageId && server) {
        await delay(2000) // wait for other resources to load
        await initLexiconForTestament(isNT_) // find lexicon for current testament
        await delay(1000) // wait for other resources to load
        await initLexiconForTestament(!isNT_) // find lexicon for other testament
      }
    }

    getLexicons()
  }, [languageId, server])

  function getGlossesCachePath() {
    const lexiconCachePath = `${origlangLexConfig.server}/${origlangLexConfig.owner}/${origlangLexConfig.languageId}_${origlangLexConfig.resourceId}/${origlangLexConfig.ref}`
    return lexiconCachePath
  }

  useEffect(() => {
    /**
     * make sure we have downloaded lexicon zip
     * @return {Promise<void>}
     */
    const loadLexiconDataForRepo = async () => {
      if (!fetchingLexicon && repository && lexiconProps?.actions?.storeZip) {
        setFetchingLexicon(true)
        let lexiconWords = await fetchFromGlossesStore(getGlossesCachePath())

        if (!lexiconWords) {
          lexiconWords = {}
        } else {
          console.log(`useLexicon.loadLexiconDataForRepo: ${getGlossesCachePath()} cached lexicon words length`, Object.keys(lexiconWords).length)
        }

        let lexiconRepoCached = await isLexiconRepoCached()

        if (lexiconRepoCached) {
          console.log(`useLexicon.loadLexiconDataForRepo: lexicon zip already loaded`)
        } else {
          // fetch repo zip file and store in index DB
          await lexiconProps?.actions?.storeZip()
          // verify that zip file is loaded
          lexiconRepoCached = await isLexiconRepoCached()
        }

        if (lexiconRepoCached) {
          await updateLexiconGlosses(lexiconWords)
          setLexCacheInit(true)
        } else {
          console.warn(`useLexicon.loadLexiconDataForRepo: could not load lexicon repo zip: ${getGlossesCachePath()}`)
        }

        setFetchingLexicon(false)
      }
    }

    loadLexiconDataForRepo()
  }, [repository])

  useEffect(() => {
    const updateGlossesForLatestVerse = async () => {
      if (lexCacheInit) {
        if (strongsNumbersInVerse) { // get Lexicons for current verse
          await fetchGlossesForStrongsNumbers(strongsNumbersInVerse)
        }
      }
    }

    updateGlossesForLatestVerse()
  }, [lexCacheInit])


  return {
    state: {
      repository,
      greekLexConfig,
      hebrewLexConfig,
      origlangLexConfig,
    },
    actions: {
      fetchGlossesForStrongsNumbers,
      fetchGlossesForVerse,
      getLexiconData,
      setGreekLexConfig,
      setHebrewLexConfig,
    },
  }
}

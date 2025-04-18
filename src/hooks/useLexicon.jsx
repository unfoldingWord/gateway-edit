import { useEffect, useState } from 'react'
import isEqual from 'deep-equal'
import { getFilesFromRepoZip, useRepository } from 'gitea-react-toolkit'
import { core } from 'scripture-resources-rcl'
import { isNT } from '@common/BooksOfTheBible'
import { delay } from '@utils/resources'
import {
  extractGlossesFromRepoZip,
  fetchFromGlossesStore,
  getOriginalLanguageStr,
  findBestLexicon,
  saveToGlossesStore,
} from '@utils/lexiconHelpers'

export default function useLexicon({
  bookId,
  languageId,
  server,
}) {
  const [greekError, setGreekError] = useState(null)
  const [hebrewError, setHebrewError] = useState(null)
  const [repository, setRepository] = useState(null)
  const [lexCacheInit, setLexCacheInit] = useState(false)
  const [lexiconGlosses, setLexiconGlosses] = useState(null)
  const [fetchingLexicon, setFetchingLexicon] = useState(false)
  const [fetchingGlosses, setFetchingGlosses] = useState(false)
  const [greekLexConfig, setGreekLexConfig] = useState(null)
  const [hebrewLexConfig, setHebrewLexConfig] = useState(null)
  const [strongsNumbersInVerse, setStrongsNumbersInVerse] = useState(null)

  const isNT_ = isNT(bookId)

  const origlangLexConfig = getOriginalLanguageConfig()
  const lexRepoName = origlangLexConfig ? `${origlangLexConfig.languageId}_${origlangLexConfig.resourceId}` : null
  const lexRepoFullName = origlangLexConfig ? `${origlangLexConfig.owner}/${lexRepoName}` : null
  const lexiconProps = useRepository({
    full_name: lexRepoFullName,
    branch: origlangLexConfig?.ref,
    config: origlangLexConfig,
    repository,
    onRepository,
  })

  function getOriginalLanguageConfig() {
    const origlangLexConfig = isNT_ ? greekLexConfig : hebrewLexConfig
    return origlangLexConfig
  }

  function setOrigLangError(error, isNT = isNT_) {
    if (isNT) {
      setGreekError(error)
    } else {
      setHebrewError(error)
    }
  }

  function getOrigLangError() {
    if (isNT_) {
      return greekError
    } else {
      return hebrewError
    }
  }

  useEffect(() => {
    // console.log(`useLexicon: bible ${bookId} changed testament ${isNT_}`)
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
      // console.log(`useLexicon.onRepository(): url changed to ${repo?.html_url} from ${repository?.html_url}`, repo)
      setRepository(repo)
    }
  }

  /**
   * convert status/error message to gloss format
   * @param message
   * @return {{brief, long}}
   */
  function messageToGloss(message) {
    return {
      brief: message,
      long: message,
    }
  }

  function getReasonForLexiconFailure(defaultMessage, entryId) {
    const error = getOrigLangError()
    let message = defaultMessage

    if (error) {
      message = `### ERROR: ${error}`
    } else if (!getOriginalLanguageConfig()) {
      message = `Not ready - searching for lexicon`
    } else if (!repository) {
      message = `Not ready - loading lexicon repo data`
    } else if (fetchingLexicon) {
      message = `Not ready - fetching lexicon repo`
    } else if (!lexCacheInit || fetchingGlosses) {
      message = `Not ready - initializing glosses`
    }
    // console.log(`useLexicon.getLexiconData: gloss not loaded for ${entryId}`, message)
    return message
  }

  /**
   * external function to load lexicon from cached lexicon
   * @param {string} lexiconId - lexicon to search (ugl or uhl)
   * @param {string|number} entryId - numerical part of the strongs number (e.g. '00005')
   * @return {*}
   */
  function getLexiconData(lexiconId, entryId) {
    let gloss = null

    if (lexiconGlosses && entryId) {
      gloss = lexiconGlosses[entryId.toString()]

      if (!gloss) { // show reason we can't find gloss
        const defaultMessage = `### ERROR: Gloss not found`
        const message = getReasonForLexiconFailure(defaultMessage, entryId)
        gloss = messageToGloss(message)
      }
    } else { // show error or reason glosses are not loaded
      const defaultMessage = `Not ready - glosses not yet available`
      // console.log(`useLexicon.getLexiconData - lexiconId ${lexiconId}, lexiconGlosses length = ${lexiconGlosses?.length}`)
      const message = getReasonForLexiconFailure(defaultMessage, entryId)
      gloss = messageToGloss(message)
    }
    return { [lexiconId]: { [entryId]: gloss } }
  }

  /**
   * save updated lexicon words in state and in indexDB
   * @param newLexiconGlosses
   * @return {Promise<void>}
   */
  async function updateLexiconGlosses(newLexiconGlosses) {
    // console.log(`useLexicon.updateLexiconGlosses -`, newLexiconGlosses)
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
      // console.log(`useLexicon.fetchGlossesForVerse - language ${languageId}, ${verseObjects?.length} verseObjects`)
      const wordObjects = core.getWordObjects(verseObjects)

      if (wordObjects?.length) {
        const strongs = core.getStrongsList(wordObjects)

        // check if already prefetching this list
        if (strongs?.length && !isEqual(strongs, strongsNumbersInVerse)) {
          // console.log(`useLexicon.fetchGlossesForVerse - found strongs numbers in verses`, strongs)
          setStrongsNumbersInVerse(strongs)

          if (lexiconGlosses && Object.keys(lexiconGlosses).length) {
            // console.log(`useLexicon.fetchGlossesForVerse - loading strongs numbers`)
            await fetchGlossesForStrongsNumbers(strongs)
          }
        } else if (!strongs?.length) {
          console.log(`useLexicon.fetchGlossesForVerse - no strongs numbers found`)
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
      // console.log(`useLexicon.fetchGlossesForStrongsNumber: extracting strongs list length ${strongs.length}`, strongs)
      setFetchingGlosses(true)
      let newLexiconWords = (await fetchFromGlossesStore(getGlossesCachePath())) || {}
      // console.log(`useLexicon.fetchGlossesForStrongsNumber: already extracted word length ${Object.keys(newLexiconWords).length}`, newLexiconWords)
      const files = await getFilesFromCachedLexicon()
      let modified = await extractGlossesFromRepoZip(lexRepoName, origlangLexConfig, strongs, newLexiconWords, files)

      if (modified) {
        await updateLexiconGlosses(newLexiconWords)
        // console.log('useLexicon.fetchGlossesForStrongsNumbers: lexicon words updated, length', Object.keys(newLexiconWords).length)
      } else {
        setLexiconGlosses(newLexiconWords)
      }

      // console.log('useLexicon.fetchGlossesForStrongsNumbers: new word list length', strongs?.length)
      setFetchingGlosses(false)
    }
  }

  async function unzipFileFromCachedLexicon(filename) {
    const filePath = `${origlangLexConfig.lexiconPath}/${filename}`
    const file = await lexiconProps?.actions?.fileFromZip(filePath)
    // console.log(`initLexicon.unzipFileFromCachedLexicon`, file)
    return file
  }

  async function getGlossFromCachedLexicon(strongs) {
    const filename = `${strongs}.json`
    const file = await unzipFileFromCachedLexicon(filename)
    // console.log(`initLexicon.getGlossFromCachedLexicon`, !!file)
    return file
  }

  async function isLexiconRepoCached() {
    const file = await getGlossFromCachedLexicon(1)
    // console.log(`initLexicon.isLexiconRepoCached`, !!file)
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
    const lexConfig = await findBestLexicon(languageId, server, LexOwner, branch, setLexicon, isNT)

    if (!lexConfig) {
      const OrigLang = getOriginalLanguageStr(isNT)
      setOrigLangError(`initLexicon() - failure to find ${OrigLang} Lexicon`, isNT)
    }
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
      // console.log(`useLexicon.loadLexiconDataForRepo: hook called`, { fetchingLexicon, repository, storeZip: !!lexiconProps?.actions?.storeZip})

      if (!fetchingLexicon && repository && lexiconProps?.actions?.storeZip) {
        try {
          // console.log(`useLexicon.loadLexiconDataForRepo: fetching glosses`)
          setFetchingLexicon(true)
          let lexiconWords = await fetchFromGlossesStore(getGlossesCachePath())

          if (!lexiconWords) {
            lexiconWords = {}
          } else {
            // console.log(`useLexicon.loadLexiconDataForRepo: ${getGlossesCachePath()} cached lexicon words length`, Object.keys(lexiconWords).length)
          }

          let lexiconRepoCached = await isLexiconRepoCached()

          if (lexiconRepoCached) {
            // console.log(`useLexicon.loadLexiconDataForRepo: lexicon zip already loaded`)
          } else {
            // console.log(`useLexicon.loadLexiconDataForRepo: loading from indexDB`)
            // fetch repo zip file and store in index DB
            await lexiconProps?.actions?.storeZip()
            // verify that zip file is loaded
            lexiconRepoCached = await isLexiconRepoCached()
          }

          if (lexiconRepoCached) {
            await updateLexiconGlosses(lexiconWords)
            // console.log(`useLexicon.loadLexiconDataForRepo: lexicon loaded and ready`)
            setLexCacheInit(true)
            setOrigLangError(null)
          } else {
            const originalLang = getOriginalLanguageStr(isNT_)
            console.warn(`useLexicon.loadLexiconDataForRepo: could not load ${originalLang} lexicon repo zip: ${getGlossesCachePath()}`)
            setOrigLangError(`Could not load ${originalLang} lexicon repo zip: ${getGlossesCachePath()}`)
          }
        } catch (e) {
          console.warn(`useLexicon.loadLexiconDataForRepo: exception thrown`, e)
        }

        setFetchingLexicon(false)
      }
    }

    loadLexiconDataForRepo()
  }, [repository])

  useEffect(() => {
    const updateGlossesForLatestVerse = async () => {
      if (lexCacheInit) {
        // console.log(`useLexicon - init lexCacheInit now`, { lexCacheInit, strongsNumbersInVerse })

        if (strongsNumbersInVerse) { // get Lexicons for current verse
          // console.log(`useLexicon - init calling fetchGlossesForStrongsNumbers()`)
          await fetchGlossesForStrongsNumbers(strongsNumbersInVerse)
        }
      }
    }

    updateGlossesForLatestVerse()
  }, [lexCacheInit, strongsNumbersInVerse])


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

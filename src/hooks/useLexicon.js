import { useEffect, useState } from 'react'
import * as isEqual from 'deep-equal'
import { getFilesFromRepoZip, useRepository } from 'gitea-react-toolkit'
import { isNT } from '@common/BooksOfTheBible'
import { delay } from '@utils/resources'
import {
  fetchFromLexiconStore,
  getStrongsParts,
  getWords,
  initLexicon,
  lexiconEntryIdFromStrongs, lexiconIdFromStrongs,
  saveToLexiconStore,
} from '@utils/lexiconHelpers'

export default function useLexicon({
  bookId,
  languageId,
  server,
}) {
  const [repository, setRepository] = useState(null)
  const [lexCacheInit, setLexCacheInit] = useState(false)
  const [lexiconWords, setLexiconWords] = useState(null)
  const [fetchingLex, setFetchingLex] = useState(false)
  const [fetchingWords, setFetchingWords] = useState(false)
  const [greekLexConfig, setGreekLexConfig] = useState(null)
  const [hebrewLexConfig, setHebrewLexConfig] = useState(null)
  const [strongsForVerse, setStrongsForVerse] = useState(null)

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
    setStrongsForVerse(null)
    setLexiconWords(null)
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
   * @param {string|number} lexiconId
   * @return {*}
   */
  function getLexiconData(lexiconId) {
    const lexicon = lexiconWords?.[lexiconId.toString()]
    return lexicon
  }

  /**
   * save updated lexicon words in state and in indexDB
   * @param newLexiconWords
   * @return {Promise<void>}
   */
  async function updateLexiconWords(newLexiconWords) {
    setLexiconWords(newLexiconWords)
    await saveToLexiconStore(getLexiconCachePath(), newLexiconWords)
  }

  async function fetchLexiconsForVerse(verseObjects, languageId) {
    if (origlangLexConfig?.origLangId !== languageId) {
      return false
    }
    console.log(`fetchLexiconsForVerse; language ${languageId} same as ${origlangLexConfig?.origLangId}`, verseObjects)

    if (origlangLexConfig && verseObjects?.length && !fetchingWords) {
      const words = getWords(verseObjects)

      if (words?.length) {
        const strongs = words.map(word => (word.strongs || word.strong)).filter(word => word)

        if (strongs?.length && !isEqual(strongs, strongsForVerse)) {
          if (lexiconWords && Object.keys(lexiconWords).length) {
            console.log(`fetchLexiconsForVerse`, verseObjects)
            await fetchLexiconsForStrongs(strongs)
          } else { // lexicon words not loaded, save strongs list for later
            setStrongsForVerse(strongs)
          }
        }
      }
    }
  }

  /**
   * used to preload lexicon data from list of strongs numbers (useful to do as verse is loaded)
   * @param {array} strongs
   * @return {Promise<void>}
   */
  async function fetchLexiconsForStrongs(strongs) {
    if (strongs?.length && !fetchingWords && origlangLexConfig) {
      setFetchingWords(true)
      let newLexiconWords = await fetchFromLexiconStore(getLexiconCachePath())
      newLexiconWords = newLexiconWords || {}
      const files = await getFilesFromRepoZip({
        owner: origlangLexConfig.owner,
        repo: lexRepoName,
        branch: origlangLexConfig.ref,
        config: { server: origlangLexConfig.server },
      })
      const fileNames = Object.keys(files)
      let modified = false

      if (fileNames && fileNames.length) {
        const path = `${lexRepoName}/${origlangLexConfig?.lexiconPath}`

        for (let i = 0, l = strongs.length; i < l; i++) {
          const strongStr = strongs[i]
          const parts = getStrongsParts(strongStr) // hebrew words can be compound, so fetch each part

          for (let i = 0, len = parts.length; i < len; i++) {
            const part = parts[i]
            const strong = lexiconEntryIdFromStrongs(part)
            const lexiconId = lexiconIdFromStrongs(part)

            if ((lexiconId !== origlangLexConfig.resourceId)) { // ignore word not in this lexicon
              console.log(`skipping ${part}`)
            } else if (!newLexiconWords[strong]) { // if not found, lookup
              const fullPath = `${path}/${strong}.json`
              const fileObject = files[fullPath]

              if (fileObject) { // if strong number found
                // eslint-disable-next-line no-await-in-loop
                const fileData = await fileObject.async('string')
                const lexicon = JSON.parse(fileData)
                lexicon.repo = lexRepoName
                newLexiconWords[strong] = lexicon
                modified = true
              }
            }
          }
        }
      }

      if (modified) {
        await updateLexiconWords(newLexiconWords)
        console.log('fetchLexiconsForStrongs: lexicon words updated, length', Object.keys(newLexiconWords).length)
      } else {
        setLexiconWords(newLexiconWords)
      }

      console.log('fetchLexiconsForStrongs: new word list length', strongs?.length)
      setStrongsForVerse(strongs)
      setFetchingWords(false)
    }
  }

  async function fetchLexiconFile(filename) {
    const filePath = `${origlangLexConfig.lexiconPath}/${filename}`
    const file = await lexiconProps?.actions?.fileFromZip(filePath)
    return file
  }

  async function getLexiconEntry(strongs) {
    const filename = `${strongs}.json`
    const file = await fetchLexiconFile(filename)
    return file
  }

  async function isLexiconCached() {
    const strongs = 1
    const file = await getLexiconEntry(strongs)
    return !!file
  }

  async function initLexiconForTestament(isNT) {
    const LexOwner = 'test_org'
    const branch = 'master'
    const setLexicon = isNT ? setGreekLexConfig : setHebrewLexConfig
    await initLexicon(languageId, server, LexOwner, branch, setLexicon, isNT)
  }

  useEffect(() => {
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

  function getLexiconCachePath() {
    const lexiconCachePath = `${origlangLexConfig.server}/${origlangLexConfig.owner}/${origlangLexConfig.languageId}_${origlangLexConfig.resourceId}/${origlangLexConfig.ref}`
    return lexiconCachePath
  }

  useEffect(() => {
    const loadLexiconData = async () => {
      if (!fetchingLex && repository && lexiconProps?.actions?.storeZip) {
        setFetchingLex(true)
        let lexiconWords = await fetchFromLexiconStore(getLexiconCachePath())

        if (!lexiconWords) {
          lexiconWords = {}
        }
        console.log(`useLexicon.loadLexiconData: ${getLexiconCachePath()} cached lexicon words length`, Object.keys(lexiconWords).length)

        let repoReadable = await isLexiconCached()

        if (repoReadable) {
          console.log(`useLexicon.loadLexiconData: lexicon zip already loaded`)
        } else {
          // fetch repo zip file and store in index DB
          await lexiconProps?.actions?.storeZip()
          // verify that zip file is loaded
          repoReadable = await isLexiconCached()

          if (!repoReadable) {
            console.warn(`useLexicon.loadLexiconData: could not load lexicon zip`)
          }
        }

        if (repoReadable) {
          await updateLexiconWords(lexiconWords)
          setLexCacheInit(true)
        }

        setFetchingLex(false)
      }
    }

    loadLexiconData()
  }, [repository])

  useEffect(() => {
    const updateWords = async () => {
      if (lexCacheInit) {
        console.log('init finished')

        if (strongsForVerse) {
          await fetchLexiconsForStrongs(strongsForVerse)
        }
      }
    }

    updateWords()
  }, [lexCacheInit])


  return {
    state: {
      repository,
      greekLexConfig,
      hebrewLexConfig,
      origlangLexConfig,
    },
    actions: {
      fetchLexiconsForStrongs,
      fetchLexiconsForVerse,
      getLexiconData,
      setGreekLexConfig,
      setHebrewLexConfig,
    },
  }
}

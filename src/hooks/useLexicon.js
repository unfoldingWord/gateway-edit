import { useEffect, useState } from 'react'
import { getFilesFromRepoZip, useRepository } from 'gitea-react-toolkit'
import { isNT } from '@common/BooksOfTheBible'
import { delay } from '@utils/resources'
import {
  fetchFromLexiconStore,
  getStrongsParts,
  initLexicon,
  lexiconEntryIdFromStrongs,
  saveToLexiconStore,
} from '@utils/lexiconHelpers'

/**
 * manage state for feedbackCard
 * @param {boolean} open - true when card is displayed
 * @return {{state: {setEmailError: (value: unknown) => void, submitting: boolean, showError: boolean, emailError: unknown, showEmailError: boolean, name: string, category: string, message: string, networkError: unknown, showSuccess: boolean, email: string}, actions: {setName: (value: (((prevState: string) => string) | string)) => void, setSubmitting: (value: (((prevState: boolean) => boolean) | boolean)) => void, doUpdateBounds: doUpdateBounds, setEmail: (value: (((prevState: string) => string) | string)) => void, setCategory: (value: (((prevState: string) => string) | string)) => void, setShowError: (value: (((prevState: boolean) => boolean) | boolean)) => void, setShowSuccess: (value: (((prevState: boolean) => boolean) | boolean)) => void, setShowEmailError: (value: (((prevState: boolean) => boolean) | boolean)) => void, setMessage: (value: (((prevState: string) => string) | string)) => void, setNetworkError: (value: unknown) => void}}}
 */
export default function useLexicon({
  bookId,
  languageId,
  server,
}) {
  const [repository, setRepository] = useState(null)
  const [lexiconWords, setLexiconWords] = useState(null)
  const [fetchingLex, setFetchingLex] = useState(false)
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
  console.log(`StoreContext: useRepository parms`, lexRepoParams)
  const lexiconProps = useRepository(lexRepoParams)

  /**
   * callback function for when useRepository has loaded repo
   * @param repo
   */
  function onRepository(repo) {
    console.log(`useLexicon.onRepository():`, repo)

    if ( repo?.branch && (repo?.html_url !== repository?.html_url)) {
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

  /**
   * used to preload lexicon data from list of strongs numbers (useful to do as verse is loaded)
   * @param {array[string]} strongs
   * @param {object} lexicon_
   * @return {Promise<void>}
   */
  async function fetchLexiconsForStrongs(strongs, lexicon_ = lexiconWords) {
    if (strongs && strongs.length) {
      const newLexiconWords = { ...lexicon_ }
      const files = await getFilesFromRepoZip({
        owner: origlangLexConfig.owner,
        repo: lexRepoName,
        branch: origlangLexConfig.ref,
        config: { server: origlangLexConfig.server },
      })
      console.log('files', files)
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

            if (!newLexiconWords[strong]) { // if not found, lookup
              const fullPath = `${path}/${strong}.json`
              const fileObject = files[fullPath]

              if (fileObject) { // if strong number found
                // eslint-disable-next-line no-await-in-loop
                const fileData = await fileObject.async('string')
                newLexiconWords[strong] = JSON.parse(fileData)
                modified = true
              }
            }
          }
        }
      }

      if (modified) {
        await updateLexiconWords(newLexiconWords)
      }

      setStrongsForVerse(strongs)
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

  useEffect(() => {
    console.log(`useLexicon: bible ${bookId} changed testament ${isNT_}`)
    setRepository(null) // clear lexicon repo so it's reloaded after testament change
  }, [isNT_])

  function getLexiconCachePath() {
    const lexiconCachePath = `${origlangLexConfig.server}/${origlangLexConfig.owner}/${origlangLexConfig.languageId}_${origlangLexConfig.resourceId}/${origlangLexConfig.ref}`
    return lexiconCachePath
  }

  useEffect(() => {
    const getLexZip = async () => {
      if (!fetchingLex && repository && lexiconProps?.actions?.storeZip && origlangLexConfig) {
        setFetchingLex(true)
        let lexiconWords = await fetchFromLexiconStore(getLexiconCachePath())

        if (!lexiconWords) {
          lexiconWords = {}
        }

        let repoReadable = await isLexiconCached()

        if (repoReadable) {
          console.log(`useLexicon: lexicon zip already loaded`)
        } else {
          // fetch repo zip file and store in index DB
          await lexiconProps?.actions?.storeZip()
          // verify that zip file is loaded
          repoReadable = await isLexiconCached()

          if (!repoReadable) {
            console.warn(`useLexicon: could not load lexicon zip`)
          }
        }

        if (repoReadable) {
          if (strongsForVerse) {
            await fetchLexiconsForStrongs(strongsForVerse, lexiconWords)
          } else {
            // await fetchLexiconsForStrongs(['G10', 'G20', 'G30'], lexiconWords) // TODO: remove
            await updateLexiconWords(lexiconWords)
          }
        }

        setFetchingLex(false)
      }
    }

    getLexZip()
  }, [repository])

  return {
    state: {
      repository,
      greekLexConfig,
      hebrewLexConfig,
      origlangLexConfig,
    },
    actions: {
      fetchLexiconsForStrongs,
      getLexiconData,
      setGreekLexConfig,
      setHebrewLexConfig,
    },
  }
}

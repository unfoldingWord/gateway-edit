import localforage from 'localforage'
import { core } from 'scripture-resources-rcl'
import {
  HTTP_CONFIG,
  HTTP_LONG_CONFIG,
} from '@common/constants'

// TRICKY - importing from direct path gets around exported css styles which crash nextjs
import {
  getStrongsParts,
  lexiconEntryIdFromStrongs,
  lexiconIdFromStrongs,
} from 'tc-ui-toolkit/lib/ScripturePane/helpers/lexiconHelpers'
import translation from '../common/translation.json'

// caches lexicons in indexDB
const lexiconStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'lexicon-store',
})

/**
 * initialize Lexicon - make sure we have loaded the lexicon into local storage
 * @param {string} languageId
 * @param {string} server
 * @param {string} owner
 * @param {string} ref
 * @param {function} setLexConfig - for saving the lexicon's configuration
 * @param {boolean} isNt
 * @return {Promise<{owner, server, resourceId: string, httpConfig: {cache: {maxAge: number}, timeout: number}, lexiconPath: *, languageId}|null>}
 */
export async function initLexicon(languageId, server, owner, ref, setLexConfig, isNt) {
  // TODO add checking in in unfoldingWord and current repo for languageId and fallback to en
  const OrigLang = isNt ? 'Greek' : 'Hebrew'
  let lexConfig = await getLexicon(languageId, HTTP_CONFIG, server, owner, ref, isNt)

  if (lexConfig) {
    const resourceId = core.getLexiconResourceID(isNt)
    const repository = `${languageId}_${resourceId}`
    setLexConfig && setLexConfig(lexConfig)
    console.log(`initLexicon() found ${OrigLang} Lexicon fetch success`, repository)

    // await delay(2000)
    // const success = await fetchRepositoryZipFile({
    //   username: owner,
    //   repository,
    //   branch: ref,
    //   options: {},
    // })
    // console.log(`${OrigLang} Lexicon fetch success`, success)
    // const data = await getLexiconEntry(lexConfig, 1)
    // console.log(`${OrigLang} Lexicon data`, data)
  } else {
    console.error(`WorkspaceContainer - failure to find ${OrigLang} Lexicon in ${languageId}`)
  }
  return lexConfig
}

/**
 * fetch the lexicon repo data
 * @param {string} languageId
 * @param {object} httpConfig
 * @param {string} server
 * @param {string} owner
 * @param {string} ref - branch or tag
 * @param {boolean} isNt
 * @return {Promise<{owner, server, resourceId: (string), httpConfig: {cache: {maxAge: number}, timeout: number}, lexiconPath: *, languageId}|null>}
 */
export async function getLexicon(languageId, httpConfig, server, owner, ref, isNt) {
  // TODO: add searching for best lexicon
  const config_ = {
    server,
    ...httpConfig,
    noCache: true,
  }
  const origLangId = isNt ? 'el-x-koine' : 'hbo'
  const resourceId = core.getLexiconResourceID(isNt)
  let results

  try {
    results = await core.getResourceManifest({
      username: owner,
      languageId,
      resourceId: resourceId,
      config: config_,
      fullResponse: true,
      ref,
    })
  } catch (e) {
    console.log(`getLexicon failed ${languageId}_${resourceId}: `, e)
  }

  console.log('manifest', results?.manifest)

  if (results?.manifest) {
    const lexicon = results?.manifest?.projects?.find(item => (item.identifier === resourceId))
    console.log('lexicon', lexicon)

    if (lexicon) {
      let lexiconPath = lexicon?.path

      if (lexiconPath) {
        if (lexiconPath.substr(0, 2) === './') {
          lexiconPath = lexiconPath.substr(2)
        }
        results.lexiconPath = lexiconPath
        const lexConfig = {
          httpConfig: HTTP_LONG_CONFIG,
          server,
          owner,
          languageId,
          resourceId,
          lexiconPath,
          ref,
          origLangId,
        }
        return lexConfig
      }
    }
  }

  return null
}

export async function saveToLexiconStore(lexiconCachePath, data) {
  await lexiconStore.setItem(lexiconCachePath, data)
}

export async function fetchFromLexiconStore(lexiconCachePath) {
  const data = await lexiconStore.getItem(lexiconCachePath)
  return data
}

/**
 * iterate through strongs numbers and extract lexicon from repo zip file
 * @param {string} lexRepoName - name of the current repo (e.g. 'en_ugl')
 * @param {object} origlangLexConfig - config data for current original language lexicon
 * @param {array} strongs - strongs numbers to look up
 * @param {object} lexiconWords - unzipped lexicon data
 * @param {object} files - zipped files containing lexicon data
 * @return {Promise<boolean>}
 */
export async function extractLexiconsFromRepoZip(lexRepoName, origlangLexConfig, strongs, lexiconWords, files) {
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

        if ((lexiconId === origlangLexConfig.resourceId) && // if word is in this lexicon
          (!lexiconWords[strong])) { // if not found, lookup
          const fullPath = `${path}/${strong}.json`
          const fileObject = files[fullPath]

          if (fileObject) { // if strong number found
            // eslint-disable-next-line no-await-in-loop
            const fileData = await fileObject.async('string')
            const lexicon = JSON.parse(fileData)
            lexicon.repo = lexRepoName
            lexiconWords[strong] = lexicon
            modified = true
          }
        }
      }
    }
  }
  return modified
}

export function translate(key) {
  const text = translation[key]

  if (text) {
    return text
  }
  return key
}


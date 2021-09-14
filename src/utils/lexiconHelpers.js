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
import translations from '../common/translation.json'

// caches lexicons in indexDB
const GlossesStore = localforage.createInstance({
  driver: [localforage.INDEXEDDB],
  name: 'gloss-store',
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
export async function initLexicon(
  languageId,
  server,
  owner,
  ref,
  setLexConfig,
  isNt) {
  // TODO add checking in in unfoldingWord and current repo for languageId and fallback to en
  const OrigLang = isNt ? 'Greek' : 'Hebrew'
  let lexConfig = await getLexiconData(languageId, HTTP_CONFIG, server, owner, ref, isNt)

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
    console.error(`initLexicon() - failure to find ${OrigLang} Lexicon in ${languageId}`)
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
export async function getLexiconData(
  languageId,
  httpConfig,
  server,
  owner,
  ref,
  isNt) {
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
    console.log(`getLexiconData failed ${languageId}_${resourceId}: `, e)
  }

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

export async function saveToGlossesStore(glossesCachePath, data) {
  await GlossesStore.setItem(glossesCachePath, data)
}

export async function fetchFromGlossesStore(glossesCachePath) {
  const data = await GlossesStore.getItem(glossesCachePath)
  return data
}

/**
 * iterate through strongs numbers and extract glosses from lexicon repo zipped files
 * @param {string} lexRepoName - name of the current repo (e.g. 'en_ugl')
 * @param {object} origlangLexConfig - config data for current original language lexicon
 * @param {array} strongs - strongs numbers to look up
 * @param {object} lexiconGlosses - unzipped glosses
 * @param {object} repoFiles - zipped files containing gloss data
 * @return {Promise<boolean>}
 */
export async function extractGlossesFromRepoZip(
  lexRepoName,
  origlangLexConfig,
  strongs,
  lexiconGlosses,
  repoFiles) {
  const fileNames = Object.keys(repoFiles)
  let modified = false

  if (fileNames && fileNames.length) {
    const path = `${lexRepoName}/${origlangLexConfig?.lexiconPath}`

    for (let i = 0, l = strongs.length; i < l; i++) {
      const strongStr = strongs[i]
      const parts = getStrongsParts(strongStr) // hebrew words can be compound, so fetch each part

      for (let i = 0, len = parts.length; i < len; i++) {
        const part = parts[i]
        const strong = lexiconEntryIdFromStrongs(part)
        const glossID = lexiconIdFromStrongs(part)

        if ((glossID === origlangLexConfig.resourceId) && // if word is in this lexicon
          (!lexiconGlosses[strong])) { // if not found, lookup
          const fullPath = `${path}/${strong}.json`
          const fileObject = repoFiles[fullPath]

          if (fileObject) { // if strong number found
            // eslint-disable-next-line no-await-in-loop
            const fileData = await fileObject.async('string')
            const gloss = JSON.parse(fileData)
            gloss.repo = lexRepoName
            lexiconGlosses[strong] = gloss
            modified = true
          }
        }
      }
    }
  }
  return modified
}

/**
 * lookup key in translations, if not found returns key
 * @param key
 * @return {*}
 */
export function translate(key) {
  const text = translations?.[key]

  if (text) {
    return text
  }
  return key
}


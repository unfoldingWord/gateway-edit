import { core } from 'scripture-resources-rcl'
import { get } from 'gitea-react-toolkit'
import {
  HTTP_CONFIG,
  HTTP_LONG_CONFIG,
} from '@common/constants'
import { getResponseData } from 'scripture-resources-rcl/dist/core/resources'

/**
 * get Lexicon Entry
 * @param {object} lexConfig
 * @param {string|number} strongs - strong's number
 * @return {Promise<Object|null>}
 */
export async function getLexiconEntry(lexConfig, strongs) {
  const config = {
    ...lexConfig,
    strongs,
  }
  const results = await getLexiconEntryLowLevel(config)
  return results
}

/**
 * get Lexicon Entry
 * @param httpConfig
 * @param {string} server
 * @param {string} owner
 * @param {string} languageId
 * @param {string} resourceId
 * @param {string} lexiconPath
 * @param {string|number} strongs - strong's number
 * @return {Promise<object|null>}
 */
async function getLexiconEntryLowLevel({
  httpConfig,
  server,
  owner,
  languageId,
  resourceId,
  lexiconPath,
  strongs,
}) {
  const filename = `${strongs}.json`
  const ref = 'master'

  const filePath = `${lexiconPath}/${filename}`
  let url = `${server}/api/v1/repos/${owner}/${languageId}_${resourceId}/contents/${filePath}?ref=${ref}`
  let json = null

  try {
    const result = await get({
      url,
      params: {},
      config: httpConfig,
      fullResponse: true,
    }).then(response => {
      const resourceDescr = `${languageId}_${resourceId}, ref '${ref}'`

      if (response?.status !== 200) {
        const message = `getLexiconEntryLowLevel: Error code ${response?.status} fetching '${url}' for '${resourceDescr}'`
        console.log(`failure reading`, message)
        return null
      }
      return response
    })
    json = getResponseData(result)
    console.log('json', json)
    const data = JSON.parse(json)
    return data
  } catch (e) {
    const httpCode = e?.response?.status || 0

    console.warn(
      `getLexiconEntryLowLevel - httpCode ${httpCode}, article not found`, e
    )
  }
  return null
}

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
    const resourceId = getLexiconResourceID(isNt)
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

function getLexiconResourceID(isNt) {
  const resourceId = isNt ? 'ugl' : 'uhl'
  return resourceId
}

/**
 * get the lexicon repo
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
  const resourceId = getLexiconResourceID(isNt)
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
        }
        return lexConfig
      }
    }
  }

  return null
}

export function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  )
}

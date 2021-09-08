import { getResourceLink } from 'single-scripture-rcl'
import { core } from 'scripture-resources-rcl'
import { get } from 'gitea-react-toolkit'
import {
  HTTP_CONFIG,
  HTTP_GET_MAX_WAIT_TIME,
  HTTP_LONG_CONFIG,
  LOADING_RESOURCE,
  MANIFEST_INVALID_ERROR,
  MANIFEST_NOT_FOUND_ERROR,
} from '@common/constants'
import {
  INITIALIZED_STATE,
  INVALID_MANIFEST_ERROR,
  LOADING_STATE,
  MANIFEST_NOT_LOADED_ERROR,
} from 'translation-helps-rcl'
import { doFetch } from '@utils/network'
import { getResponseData } from 'scripture-resources-rcl/dist/core/resources'

export async function getResource({
  bookId,
  chapter,
  verse,
  resourceId,
  owner,
  languageId,
  ref,
  server,
}) {
  const resourceLink = getResourceLink({
    owner,
    languageId,
    resourceId,
    ref,
  })

  let resource

  try {
    resource = await core.resourceFromResourceLink({
      resourceLink,
      reference: {
        projectId: bookId,
        chapter: chapter,
        verse: verse,
      },
      config: {
        server,
        cache: { maxAge: 1 * 60 * 60 * 1000 }, // 1 hr
        timeout: HTTP_GET_MAX_WAIT_TIME,
      },
    })
  } catch (e) {
    console.log(`getResource(${resourceLink}) failed, exception: `, e)
  }

  resource = resource || {}
  resource.resourceLink = getRepoUrl(owner, languageId, resourceId, server)
  return resource
}

export async function getResourceManifest(resourceRef) {
  const resource = await getResource(resourceRef)

  if (!resource?.manifest) {
    console.log(`getResourceManifest(${ getResourceLink(resourceRef) }) failed`)
    return null
  }

  return resource?.manifest
}

export async function getResourceBibles(resourceRef) {
  let bibles = null
  let httpCode = null
  const resource = await getResource(resourceRef)

  if (resource?.manifest?.projects) {
    bibles = resource.manifest.projects.map((item) => (item.identifier))
  } else {
    console.log(`getResourceBibles() response`, resource?.manifestHttpResponse)
    httpCode = resource?.manifestHttpResponse?.status
  }

  const resourceLink = resource?.resourceLink
  return { bibles, httpCode, resourceLink }
}

/**
 * make url for repo
 * @param owner
 * @param languageId
 * @param resourceId
 * @param server
 * @return {string}
 */
export function getRepoUrl(owner, languageId, resourceId, server) {
  const repoUrl = `${owner}/${languageId}_${resourceId}`
  return `${server || ''}/${repoUrl}`
}

/**
 * Appends path to resource repo to error message
 * @param errorStr - base error message
 * @param owner
 * @param languageId
 * @param resourceId
 * @param server
 * @param {string} ref - optional ref (branch or tag)
 * @return {string} error string with resource path
 */
export function getErrorMessageForResourceLink(errorStr, owner, languageId, resourceId, server, ref = null) {
  let repoUrl = getRepoUrl(owner, languageId, resourceId, server)

  if (ref) {
    repoUrl += `&ref=${ref}`
  }

  const errorMsg = errorStr + repoUrl
  return errorMsg
}


/**
 * decode resource status into string.  Currently only English
 * @param resourceStatus - object that contains state and errors that are detected
 * @param owner
 * @param languageId
 * @param resourceId
 * @param server - contains the server being used
 * @param {string} ref - optional ref (branch or tag)
 * @return empty string if no error, else returns user error message
 */
export function getResourceMessage(resourceStatus, owner, languageId, resourceId, server, ref = null) {
  let message = ''

  if (resourceStatus[LOADING_STATE]) {
    message = LOADING_RESOURCE
  } else if (resourceStatus[INITIALIZED_STATE]) {
    if (resourceStatus[MANIFEST_NOT_LOADED_ERROR]) {
      message = MANIFEST_NOT_FOUND_ERROR
    } else if (resourceStatus[INVALID_MANIFEST_ERROR]) {
      message = MANIFEST_INVALID_ERROR
    }

    if (message) {
      message = getErrorMessageForResourceLink(message, owner, languageId, resourceId, server, ref)
      console.log(`getResourceMessage() - Resource Error: ${message}`, resourceStatus)
    }
  }
  return message
}

/**
 * find the latest version for published bible
 * @param {string} server
 * @param {string} org
 * @param {string} lang
 * @param {string} bible
 * @param {function} processError
 * @return {Promise<*>}
 */
export async function getLatestBibleRepo(server, org, lang, bible, processError) {
  const url = `${server}/api/catalog/v5/search/${org}/${lang}_${bible}`
  const results = await doFetch(url, {}, HTTP_GET_MAX_WAIT_TIME)
    .then(response => {
      if (response?.status !== 200) {
        const errorCode = response?.status
        console.warn(`WorkSpace - error getting latest original lang from ${url}, ${errorCode}`)
        processError(null, errorCode)
        return null
      }
      return response?.data
    })
  const foundItem = results?.data?.[0]
  let repo = foundItem?.url

  if (foundItem?.metadata_api_contents_url) {
    // "metadata_api_contents_url": "https://qa.door43.org/api/v1/repos/unfoldingWord/el-x-koine_ugnt/contents/manifest.yaml?ref=v0.9"
    let parts = foundItem?.metadata_api_contents_url.split('?')
    let pathParts = parts[0].split('/')
    pathParts = pathParts.slice(0, -1)
    repo = pathParts.join('/') + '?' + parts[1]
  }
  return repo
}

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
  let lexConfig = await getLexicon(languageId, HTTP_CONFIG, server, owner, ref, true)
  const OrigLang = isNt ? 'Greek' : 'Hebrew'

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

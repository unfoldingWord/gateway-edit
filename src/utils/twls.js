import { isNT, NT_BOOKS, OT_BOOKS } from '../common/BooksOfTheBible';
import { doFetch } from './network';
import { HTTP_CONFIG, HTTP_GET_MAX_WAIT_TIME } from '../common/constants';
import tsvToJson from './tsv';
import { core } from 'scripture-resources-rcl';

export async function loadTwls(resource, owner, repo, bookID){
  const projects = resource?.manifest?.projects
  if (projects?.length) {
    const twlData = {}
    let olBibleRepo = null
    let books = null
    let olManifest = null
    let url = null

    if (isNT(bookID)) {
      olBibleRepo = "el-x-koine_ugnt"
      books = NT_BOOKS
    } else {
      olBibleRepo = "hbo_uhb"
      books = OT_BOOKS
    }

    const [ languageId, resourceId ] = olBibleRepo.split('_');
    try {
      const response = await core.getResourceManifest({
        username: owner,
        languageId,
        resourceId,
        config: {
          ...HTTP_CONFIG,
          noCache: false,
          server: resource?.config?.server,
        },
        fullResponse: true,
      })
      olManifest = response?.manifest
    } catch (e) {
      console.warn(`loadTwls() - error getting manifest for ${owner}/${olBibleRepo}`, e)
      books = []
    }

    for (const book of books) {
      const project = projects?.find(p => (p.identifier === book))
      const book_ = project?.identifier
      if (!book_) {
        console.log('book not found', book)
        continue
      }

      console.log('tsv project found', project)

      // normalize path
      let projectPath = project?.path || ''
      if (projectPath[0] === '.') {
        projectPath = projectPath.substring(1)
      }
      if (projectPath[0] === '/') {
        projectPath = projectPath.substring(1)
      }

      url = `${resource?.config?.server}/${owner}/${repo}/raw/branch/master/${projectPath}`
      let data = await doFetch(url, null, HTTP_GET_MAX_WAIT_TIME, false).then(response => {
        if (response?.status !== 200) {
          const errorCode = response?.status
          console.warn(`loadTwls() - error getting TWL data from ${url}, ${errorCode}`)
          return null
        }
        return response?.data
      })
      const twls = tsvToJson(data)
      console.log(`fetched data for ${owner}/${repo}/${projectPath}, file size`, twls?.length)

      const olProject = olManifest?.projects?.find(p => (p.identifier === book))
      const _book = project?.identifier
      if (!_book) {
        console.log('OL book not found', book)
        continue
      }

      // normalize path
      projectPath = project?.path || ''
      if (projectPath[0] === '.') {
        projectPath = projectPath.substring(1)
      }
      if (projectPath[0] === '/') {
        projectPath = projectPath.substring(1)
      }

      url = `${resource?.config?.server}/${owner}/${olBibleRepo}/raw/branch/master/${projectPath}`
      data = await doFetch(url, null, HTTP_GET_MAX_WAIT_TIME, false).then(response => {
        if (response?.status !== 200) {
          const errorCode = response?.status
          console.warn(`ResourceCard - error getting TWL data from ${url}, ${errorCode}`)
          return null
        }
        return response?.data
      })

      // TODO merge data

      twlData[book] = twls
    }

    console.log(`twlData`, twlData)
    return twlData;
  }
}


import { getResourceLink } from 'single-scripture-rcl'
import { core } from 'scripture-resources-rcl'
import { version } from '../../package.json'

export async function getResource({
  bookId,
  chapter,
  verse,
  resourceId,
  owner,
  languageId,
  branch,
  server,
}) {
  const resourceLink = getResourceLink({
    owner,
    languageId,
    resourceId,
    branch,
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
        cache: { maxAge: 60 * 1000 },
      },
    })
  } catch (e) {
    console.log(`getResource(${resourceLink}) failed, exception: `, e)
  }

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
  const manifest = await getResourceManifest(resourceRef)

  if (manifest?.projects) {
    return manifest.projects.map((item) => (item.identifier))
  }

  return null
}

export function getBuildId() {
  const hash = getCommitHash()
  const buildId = { version, hash }
  console.log(`getBuildVersion() = ${JSON.stringify(buildId)}`)
  return buildId
}

export function getCommitHash() {
  let commitHash

  try {
    commitHash = process.env.NEXT_PUBLIC_BUILD_NUMBER
  } catch (e) {
    console.error(`getCommitHash() - could not get commit hash`, e)
  }
  return commitHash
}

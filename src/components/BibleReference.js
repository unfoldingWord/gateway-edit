import { useContext } from 'react'
import BibleReference, { useBibleReference } from 'bible-reference-rcl'
import { ReferenceContext } from '@context/ReferenceContext'
import { core } from 'scripture-resources-rcl'
import { getResourceLink } from 'single-scripture-rcl'

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
    return manifest.projects.map((item) => (item.title))
  }

  return null
}

function BibleReferenceComponent(props) {
  const {
    state: {
      bibleReference: { bookId, chapter, verse },
    },
    actions: { onReferenceChange },
  } = useContext(ReferenceContext)

  const { state, actions } = useBibleReference({
    initialBook: bookId,
    initialChapter: chapter,
    initialVerse: verse,
    onChange: onReferenceChange,
  })

  return (
    <BibleReference
      status={state}
      actions={actions}
      style={{ color: '#ffffff' }}
    />
  )
}

export default BibleReferenceComponent

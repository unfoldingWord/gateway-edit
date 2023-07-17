import { version } from '../../package.json'

export function getBuildId() {
  const hash = getCommitHash()
  const buildId = { version, hash }
  return buildId
}

export function getCommitHash() {
  let commitHash

  try {
    commitHash = process.env.NEXT_PUBLIC_BUILD_NUMBER
    console.log('process.env.NEXT_PUBLIC_BUILD_CONTEXT:', process.env.NEXT_PUBLIC_BUILD_CONTEXT)
    console.log('process.env.NEXT_PUBLIC_BUILD_BRANCH:', process.env.NEXT_PUBLIC_BUILD_BRANCH)
  } catch (e) {
    console.error(`getCommitHash() - could not get commit hash`, e)
  }
  return commitHash
}

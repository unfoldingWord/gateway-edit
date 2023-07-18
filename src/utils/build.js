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
  } catch (e) {
    console.error(`getCommitHash() - could not get commit hash`, e)
  }
  return commitHash
}

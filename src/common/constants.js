import packagefile from '../../package.json'

export const APP_VERSION = packagefile.version
export const appName = 'translationCore:Create'
export const base_url = 'https://git.door43.org'
export const tokenid = 'PlaygroundTesting'

export const MANIFEST_NOT_FOUND_ERROR = 'This resource manifest failed to load.  Please confirm that the correct manifest.yaml file exists in the resource at:\n'
export const MANIFEST_INVALID_ERROR = 'The manifest for this resource is invalid.  Resource is at:\n'
export const NO_ORGS_ERROR = 'The application can not continue. The current username is not part of a DCS organization. Please contact your administrator.'
export const ORGS_NETWORK_ERROR = 'Network Error loading User Organizations'
export const LOADING_RESOURCE = 'Loading Resource...'

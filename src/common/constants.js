import packagefile from '../../package.json'

export const APP_VERSION = packagefile.version
export const appName = 'gatewayEdit'
export const base_url = 'https://git.door43.org'
export const tokenid = 'gatewayEdit'

export const MANIFEST_NOT_FOUND_ERROR = 'This resource manifest failed to load. Please confirm that the correct manifest.yaml file exists in the resource at:\n'
export const MANIFEST_INVALID_ERROR = 'The manifest for this resource is invalid. Resource is at:\n'
export const NO_ORGS_ERROR = 'The application can not continue. The current username is not part of a DCS organization. Please contact your administrator.'
export const ORGS_NETWORK_ERROR = 'Network Error loading User Organizations'
export const LOADING_RESOURCE = 'Loading Resource...'
export const LOCAL_NETWORK_DISCONNECTED_ERROR = 'Please check your network connection. No network connection detected.'
export const SERVER_UNREACHABLE_ERROR = 'Please check your internet connection. The application is unable to reach the server.'
// eslint-disable-next-line no-template-curly-in-string
export const SERVER_OTHER_ERROR = 'The server returned an ${http_code} error. Please try again or submit feedback.'
export const AUTHENTICATION_ERROR = 'The application is no longer logged in. Please login again.'

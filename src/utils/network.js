import {
  checkIfServerOnline,
  ERROR_NETWORK_DISCONNECTED,
  ERROR_SERVER_DISCONNECT_ERROR,
} from 'gitea-react-toolkit'
import {
  AUTHENTICATION_ERROR,
  BASE_URL,
  FEEDBACK_PAGE,
  LOCAL_NETWORK_DISCONNECTED_ERROR,
  LOGIN,
  SEND_FEEDBACK,
  SERVER_MAX_WAIT_TIME,
  SERVER_MAX_WAIT_TIME_RETRY,
  SERVER_OTHER_ERROR,
  SERVER_UNREACHABLE_ERROR,
} from '@common/constants'
import { getLocalStorageItem, setLocalStorageValue } from '@hooks/useUserLocalStorage'

export const NETWORK_DISCONNECT_ERROR = 'networkDisconnectError'
export const SERVER_CHECK_SECOND_TRY_KEY = 'serverCheckSecondTry'

export function getServerDisconnectMessage(errorMessage) {
  if (errorMessage === ERROR_NETWORK_DISCONNECTED) {
    return LOCAL_NETWORK_DISCONNECTED_ERROR
  }

  // all other errors mean that server is unreachable
  return SERVER_UNREACHABLE_ERROR
}

/**
 * checks to see if there is a fault with the server - first checks the networking connection and then
 *    checks if server is responding.
 * @return {Promise<string>} error message if server is not reachable
 */
export async function getServerFault() {
  try {
    // on retry we set longer timeout
    const secondTry = getLocalStorageItem(SERVER_CHECK_SECOND_TRY_KEY)
    setLocalStorageValue(SERVER_CHECK_SECOND_TRY_KEY, false) // clear flag
    const timeout = secondTry ? SERVER_MAX_WAIT_TIME : SERVER_MAX_WAIT_TIME_RETRY
    console.log(`getServerFault() - setting timeout to ${timeout}`) //TODO - remove
    await checkIfServerOnline(BASE_URL, { timeout }) // throws exception if server disconnected
    console.log(`getServerFault() - server is online`) //TODO - remove
    return null
  } catch (e) {
    console.warn(`getServerFault() - received error`, e)
    let errorMessage = e?.message
    return getServerDisconnectMessage(errorMessage)
  }
}

/**
 * check if error message is that network is disconnected (from checkIfServerOnline())
 * @param {Error} error
 * @return {boolean} true if network disconnected
 */
export function isServerDisconnected(error) {
  return !!error?.[ERROR_SERVER_DISCONNECT_ERROR]
}

/**
 * on networking error, first check to see if error is a server disconnected error.  If not we do a check to see if
 *    server is disconnected. Finally return appropriate error message and possible action steps
 * @param {string|Error} error - initial error message message or object
 * @param {number} httpCode - HTTP code returned
 * @return {Promise<object>} returns final error details and possible actions
 */
export async function getNetworkError(error, httpCode ) {
  let errorMessage = (typeof error === 'string') ? error : error?.message
  console.log(`getNetworkError() httpCode ${httpCode}, errorMessage '${errorMessage}': `, error)
  const serverHttpCode = error?.response?.status
  console.log(`getNetworkError() serverHttpCode ${serverHttpCode}`)
  // eslint-disable-next-line no-template-curly-in-string
  const defaultErrorMessage = SERVER_OTHER_ERROR.replace('${http_code}', `${httpCode}`)

  if (!errorMessage) { // if not given, set to default error message
    errorMessage = defaultErrorMessage
  } else if (httpCode) {
    errorMessage += `\n ${defaultErrorMessage}` // append http code if given
  }

  const lastError = {
    initialError: error,
    errorMessage,
    httpCode,
    serverHttpCode,
  }

  let serverDisconnect = isServerDisconnected(error) // check if we already have a network disconnect error
  let serverDisconnectMessage

  if (serverDisconnect) {
    serverDisconnectMessage = getServerDisconnectMessage(errorMessage)
  } else { // if we don't know yet if server is disconnected
    serverDisconnectMessage = await getServerFault() // check if server is responding
    serverDisconnect = !!serverDisconnectMessage
  }

  let actionButtonText = !serverDisconnect ? SEND_FEEDBACK : null
  let authenticationError = false

  if (serverDisconnectMessage) {
    errorMessage = serverDisconnectMessage
  } else {
    if (unAuthenticated(httpCode)) {
      errorMessage = AUTHENTICATION_ERROR
      actionButtonText = LOGIN
      authenticationError = true
    }
  }
  lastError.errorMessage = errorMessage
  return {
    errorMessage,
    actionButtonText,
    authenticationError,
    lastError,
    [NETWORK_DISCONNECT_ERROR]: serverDisconnect,
  }
}

/**
 * in the case of any networking/http error, process and display error dialog
 * @param {string|Error} error - initial error message message or object
 * @param {number} httpCode - http code returned
 * @param {function} logout - invalidate current login
 * @param {object} router - to change to different web page
 * @param {function} setNetworkError - callback to toggle display of error popup
 * @param {function} setLastError - callback to save error details
 * @param {function} setErrorMessage - optional callback to apply error message
 */
export async function processNetworkError(error, httpCode, logout, router,
                                          setNetworkError, setLastError, setErrorMessage,
) {
  setNetworkError && setNetworkError(null) // clear until processing finished
  const errorObj = await getNetworkError(error, httpCode)
  setErrorMessage && setErrorMessage(errorObj.errorMessage)
  setLastError && setLastError(errorObj.lastError) // error info to attach to sendmail
  // add params needed for button actions
  errorObj.router = router
  errorObj.logout = logout
  setNetworkError && setNetworkError(errorObj) // this triggers network error popup
}

/**
 * display popup if network disconnected error
 * @param {string|Error} error - initial error message message or object
 * @param {number} httpCode - http code returned
 * @param {function} logout - invalidate current login
 * @param {object} router - to change to different web page
 * @param {function} setNetworkError - callback to toggle display of error popup
 * @param {function} setLastError - callback to save error details
 * @param {function} setErrorMessage - optional callback to apply error message
 */
export async function addNetworkDisconnectError(error, httpCode, logout, router,
                                                setNetworkError, setLastError, setErrorMessage,
) {
  const errorObj = await getNetworkError(error, httpCode)

  if (!errorObj[NETWORK_DISCONNECT_ERROR]) {
    return // ignoring errors not due to network disconnect
  }

  setErrorMessage && setErrorMessage(errorObj.errorMessage)
  setLastError && setLastError(errorObj.lastError) // error info to attach to sendmail
  // add params needed for button actions
  errorObj.router = router
  errorObj.logout = logout
  setNetworkError && setNetworkError(errorObj) // this triggers network error popup
}

/**
 * determine if http code is authentication error
 * @param {number} httpCode
 * @return {boolean} true if not authenticated
 */
export function unAuthenticated(httpCode) {
  return ((httpCode === 403) || (httpCode === 401))
}

/**
 * refresh app
 * @param {object} networkError - contains details about how to display and handle network error - created by processNetworkError
 */
export function reloadApp(networkError) {
  setLocalStorageValue(SERVER_CHECK_SECOND_TRY_KEY, true) // we will do longer wait on retry
  networkError?.router?.reload()
}

/**
 * go to specific page
 * @param {object} router - to change to different web page
 * @param {string} page - URL to redirect to
 */
export function goToPage(router, page) {
  router?.push(page)
}

/**
 * go to feedback page
 * @param {object} networkError - contains details about how to display and handle network error - created by processNetworkError
 */
function gotoFeedback(networkError) {
  goToPage(networkError?.router, FEEDBACK_PAGE)
}

/**
 * to user to login page
 * @param {object} networkError - contains details about how to display and handle network error - created by processNetworkError
 */
function doLogin(networkError) {
  networkError?.logout && networkError.logout() // on authentication error, logout takes us to login page
}

/**
 * handle button actions, if error is authentication then take user to login, else take user to feedback page
 * @param {object} networkError - contains details about how to display and handle network error - created by processNetworkError
 */
export function onNetworkActionButton(networkError) {
  if (networkError?.authenticationError) {
    doLogin(networkError)
  } else { // otherwise we go to feedback page
    gotoFeedback(networkError)
  }
}

import {
  checkIfServerOnline,
  ERROR_NETWORK_DISCONNECTED,
  ERROR_SERVER_UNREACHABLE,
} from 'gitea-react-toolkit'
import {
  AUTHENTICATION_ERROR,
  BASE_URL,
  FEEDBACK_PAGE,
  LOCAL_NETWORK_DISCONNECTED_ERROR,
  LOGIN,
  SEND_FEEDBACK,
  SERVER_OTHER_ERROR,
  SERVER_UNREACHABLE_ERROR,
} from '@common/constants'

/**
 * checks to see if there is a fault with the server - first checks the networking connection and then
 *    checks if server is responding.
 * @return {Promise<string>} error message if server is not reachable
 */
export async function getServerFault() {
  try {
    await checkIfServerOnline(BASE_URL) // throws exception if server disconnected
    console.log(`checkIfServerOnline() - server is online`)
    return null
  } catch (e) {
    console.log(`checkIfServerOnline() - received error`, e)
    let errorMessage = e?.message

    // get type of server error
    switch (errorMessage) {
    case ERROR_NETWORK_DISCONNECTED:
      errorMessage = LOCAL_NETWORK_DISCONNECTED_ERROR
      break
    case ERROR_SERVER_UNREACHABLE:
      errorMessage = SERVER_UNREACHABLE_ERROR
      break
    default:
      break
    }
    return errorMessage
  }
}

/**
 * on networking error, first check to see if connected to network and then check if server is responding.
 *    Finally return appropriate error message and possible action steps
 * @param {string} errorMessage - error message for type of network problem
 * @param {number} httpCode - HTTP code returned
 * @return {Promise<object>} returns final error details and possible actions
 */
export async function getNetworkError(errorMessage, httpCode ) {
  // eslint-disable-next-line no-template-curly-in-string
  const defaultErrorMessage = SERVER_OTHER_ERROR.replace('${http_code}', `${httpCode}`)

  if (!errorMessage) { // if not given, set to default error message
    errorMessage = defaultErrorMessage
  } else if (httpCode) {
    errorMessage += `\n ${defaultErrorMessage}` // append http code if given
  }

  const lastError = {
    initialError: errorMessage,
    errorMessage,
    httpCode,
  }
  const serverDisconnectMessage = await getServerFault() // check if server is responding
  let actionButtonText = !serverDisconnectMessage ? SEND_FEEDBACK : null
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
    networkingError: !!serverDisconnectMessage,
  }
}

/**
 * in the case of any networking/http error, process and display error dialog
 * @param {string} [errorMessage] - initial error message
 * @param {number} [httpCode] - http code returned
 * @param {function} [logout] - invalidate current login
 * @param {object} [router] - to change to different web page
 * @param {function} setNetworkError - callback to toggle display of error popup
 * @param {function} [setLastError] - callback to save error details
 * @param {function} [setErrorMessage] - optional callback to apply error message
 */
export async function processNetworkError(errorMessage, httpCode, logout, router,
                                          setNetworkError, setLastError, setErrorMessage,
) {
  setNetworkError && setNetworkError(null) // clear until processing finished
  const error = await getNetworkError(errorMessage, httpCode)
  setErrorMessage && setErrorMessage(error.errorMessage)
  setLastError && setLastError(error.lastError) // error info to attach to sendmail
  // add params needed for button actions
  error.router = router
  error.logout = logout
  setNetworkError && setNetworkError(error) // this triggers network error popup
}

/**
 * in the case of a network connection errors only, process and display error dialog
 * @param {string} [errorMessage] - initial error message
 * @param {number} [httpCode] - http code returned
 * @param {function} [logout] - invalidate current login
 * @param {object} [router] - to change to different web page
 * @param {function} setNetworkError - callback to toggle display of error popup
 * @param {function} [setLastError] - callback to save error details
 * @param {function} [setErrorMessage] - optional callback to apply error message
 */
export async function addNetworkErrorsOnly(errorMessage, httpCode, logout, router,
                                           setNetworkError, setLastError, setErrorMessage,
) {
  const error = await getNetworkError(errorMessage, httpCode)

  if (!error.networkError) {
    console.log(`addNetworkErrorsOnly() - not showing the non-network connection errors`)
    return // ignoring non network errors
  }

  setErrorMessage && setErrorMessage(error.errorMessage)
  setLastError && setLastError(error.lastError) // error info to attach to sendmail
  // add params needed for button actions
  error.router = router
  error.logout = logout
  setNetworkError && setNetworkError(error) // this triggers network error popup
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

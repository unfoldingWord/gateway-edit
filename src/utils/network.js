import {
  checkIfServerOnline,
  ERROR_NETWORK_DISCONNECTED,
  ERROR_SERVER_UNREACHABLE,
} from 'gitea-react-toolkit'
import {
  AUTHENTICATION_ERROR,
  BASE_URL,
  LOCAL_NETWORK_DISCONNECTED_ERROR,
  LOGIN,
  NETWORK_ERROR,
  SEND_FEEDBACK,
  SERVER_OTHER_ERROR,
  SERVER_UNREACHABLE_ERROR,
} from '@common/constants'
import ErrorPopup from '@components/ErrorPopUp'

/**
 * checks to see if there is a fault with the server
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
 * on network error, first do check if server is accessible, then return appropriate error message and prompting details
 * @param {string} errorMessage - error message for type of network problem
 * @param {number} httpCode - HTTP code returned
 * @return {Promise<object>} returns final error string
 */
export async function getNetworkError(errorMessage, httpCode ) {
  if (!errorMessage) { // if not given, set to default error message
    // eslint-disable-next-line no-template-curly-in-string
    errorMessage = SERVER_OTHER_ERROR.replace('${http_code}', `${httpCode}`)
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
  }
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
 * if network error, show popup with actions appropriate for error type
 * @param {object} networkError - contains details about how to display error
 *    - created by getNetworkError.  If null then error popup not shown.
 * @param {function} setNetworkError - to close pop up
 * @param {function} logout - invalidate current login
 * @param {object} router - to change to different web page
 * @return {JSX.Element|null}
 */
export function showNetworkErrorPopup(networkError, setNetworkError, logout, router) {
  return (
    networkError ?
      <ErrorPopup
        title={NETWORK_ERROR}
        message={networkError.errorMessage}
        actionButtonStr={networkError.actionButtonText}
        onClose={() => setNetworkError(null)}
        onActionButton={() => {
          if (networkError.authenticationError) {
            logout && logout()
          } else {
            router && router.push('/feedback')
          }
        }}
      />
      :
      null
  )
}

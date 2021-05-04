import {
  checkIfServerOnline,
  ERROR_NETWORK_DISCONNECTED,
  ERROR_SERVER_UNREACHABLE,
} from 'gitea-react-toolkit'
import {
  base_url,
  LOCAL_NETWORK_DISCONNECTED_ERROR,
  SERVER_OTHER_ERROR,
  SERVER_UNREACHABLE_ERROR,
} from '@common/constants'

/**
 * checks to see if there is a fault with the server
 * @return {Promise<string>} error message if server is not reachable
 */
export async function getServerFault() {
  try {
    await checkIfServerOnline(base_url) // throws exception if server disconnected
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
 * on network error, do check if server is accessible
 * @param {string} errorMessage - error message for type of network problem
 * @param {number} errorCode - HTTP code returned
 * @param {function} saveErrorMessage - callback to apply final error message
 * @param {function} setLastError - callback to save last error object
 * @return {Promise<object>} returns final error string
 */
export async function showNetworkError(errorMessage, errorCode, setLastError, saveErrorMessage ) {
  const lastError = {
    errorMessage,
    errorCode,
  }
  const serverDisconnectMessage = await getServerFault() // check if server is responding
  let showFeedbackButton = !serverDisconnectMessage

  if (serverDisconnectMessage) {
    errorMessage = serverDisconnectMessage
  } else {
    // eslint-disable-next-line no-template-curly-in-string
    errorMessage = SERVER_OTHER_ERROR.replace('${http_code}', `${errorCode}`)
  }
  saveErrorMessage && saveErrorMessage(errorMessage)
  lastError.errorMessage = errorMessage
  setLastError && setLastError(lastError)
  showFeedbackButton = true
  return { errorMessage, showFeedbackButton }
}

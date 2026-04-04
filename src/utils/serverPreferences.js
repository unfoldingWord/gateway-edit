/**
 * Server-side user preference storage via DCS Gitea User Settings API.
 *
 * Preferences are stored as key-value pairs on the user's Gitea account at:
 *   GET/PATCH {server}/api/v1/user/settings
 *
 * This means preferences persist across browsers, devices, and incognito sessions
 * (anything that clears localStorage). All functions fail silently so localStorage
 * remains the authoritative fallback when the server is unavailable.
 */

const LAYOUT_KEY = 'gateway_edit_resource_layout'

/**
 * Returns the Authorization header value from an authentication object,
 * or null if the user is not authenticated.
 * @param {object} authentication
 * @return {string|null}
 */
function getAuthHeader(authentication) {
  return authentication?.config?.headers?.Authorization || null
}

/**
 * Retrieve the saved resource layout from the user's server account.
 * Returns the layout and whether any server settings exist.
 * @param {string} server - base URL, e.g. 'https://git.door43.org'
 * @param {object} authentication
 * @return {Promise<{layout: object|null, hasSettings: boolean}>}
 */
export async function getLayoutFromServer(server, authentication) {
  const authHeader = getAuthHeader(authentication)
  if (!authHeader) return { layout: null, hasSettings: false }

  try {
    const response = await fetch(`${server}/api/v1/user/settings`, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.log('getLayoutFromServer() - response not ok')
      return {layout: null, hasSettings: false}
    }

    const settings = await response.json()
    const hasSettings = settings && Object.keys(settings).length > 0

    const layoutValue = settings?.[LAYOUT_KEY]

    if (!layoutValue) {
      console.log(`getServerLayout() - settings missing ${LAYOUT_KEY}`)
      return { layout: null, hasSettings }
    }

    return {
      layout: JSON.parse(layoutValue),
      hasSettings,
    }
  } catch (e) {
    console.warn('getLayoutFromServer() - failed to load layout from server:', e)
    return { layout: null, hasSettings: false }
  }
}

/**
 * Save the current resource layout to the user's server account.
 * No-ops if the user is not authenticated or if the server request fails.
 * @param {string} server - base URL, e.g. 'https://git.door43.org'
 * @param {object} authentication
 * @param {object} layout - the layout object to persist
 * @return {Promise<void>}
 */
export async function saveLayoutToServer(server, authentication, layout) {
  const authHeader = getAuthHeader(authentication)
  if (!authHeader || !layout) return false

  try {
    // GET existing settings
    const response = await fetch(`${server}/api/v1/user/settings`, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.log('saveLayoutToServer() - response getting settings not ok')
      return false
    }

    const settings = await response.json()
    const hasSettings = settings && Object.keys(settings).length > 0

    if (!hasSettings) {
      console.warn('saveLayoutToServer() - failed to read settings from server')
      return false
    }

    // Merge in the new layout
    settings[LAYOUT_KEY] = JSON.stringify(layout)

    // POST merged settings
    const saveResponse = await fetch(`${server}/api/v1/user/settings`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    })

    if (!saveResponse.ok) {
      console.warn('saveLayoutToServer() - failed to save settings to server, status:', saveResponse.status)
      return false
    }

    return true
  } catch (e) {
    console.warn('saveLayoutToServer() - failed to save layout to server:', e)
    return false
  }
}

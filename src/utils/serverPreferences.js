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
 * Returns null if no layout is stored, if the user is not authenticated,
 * or if the server request fails.
 * @param {string} server - base URL, e.g. 'https://git.door43.org'
 * @param {object} authentication
 * @return {Promise<object|null>}
 */
export async function getServerLayout(server, authentication) {
  const authHeader = getAuthHeader(authentication)
  if (!authHeader) return null

  try {
    const response = await fetch(`${server}/api/v1/user/settings`, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) return null

    const settings = await response.json()
    // Gitea returns an array of {key, value} objects
    const entry = Array.isArray(settings)
      ? settings.find(s => s.key === LAYOUT_KEY)
      : null

    if (!entry?.value) return null

    return JSON.parse(entry.value)
  } catch (e) {
    console.warn('getServerLayout() - failed to load layout from server:', e)
    return null
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
export async function saveServerLayout(server, authentication, layout) {
  const authHeader = getAuthHeader(authentication)
  if (!authHeader || !layout) return

  try {
    await fetch(`${server}/api/v1/user/settings`, {
      method: 'PATCH',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settings: { [LAYOUT_KEY]: JSON.stringify(layout) },
      }),
    })
  } catch (e) {
    console.warn('saveServerLayout() - failed to save layout to server:', e)
  }
}

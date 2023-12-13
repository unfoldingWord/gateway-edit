/**
 * parse the new page path
 * @param {string} path - in format such as `/` , `/settings` or `/?server=QA`
 * @returns {{pageId: string, params: object}}
 */
export function parsePage(path) {
  if ((typeof path === 'string') && (path[0] === '/')) {
    const parts = path.substr(1).split('?') // remove any parameters
    const pageId = parts[0]
    return {
      pageId,
      params: parts?.length > 1 ? parts[1] : '',
    }
  }
  return {}
}

/**
 * reload the app at specific page and with specific params
 * @param {string} page - to go to (e.g. `/`)
 * @param {string} params - to add after ? (e.g. `server=QA`)
 */
export function reloadPage(page, params) {
  let url = `${window.location.host}${page || '/'}`

  if (params) { // if there are parameters to add
    url = url + `?${params}`
  }
  window.location.assign(url) // reload page
}

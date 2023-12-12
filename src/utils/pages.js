/**
 * parse the new page path
 * @param {string} path - in format such as `/` , `/settings` or `/?server=QA`
 * @returns {{page: string, params: object}}
 */
export function parsePage(path) {
  if ((typeof path === 'string') && (path[0] === '/')) {
    const parts = path.substr(1).split('?') // remove any parameters
    const page = parts[0]
    return {
      page,
      params: parts?.length > 1 ? parts[1] : '',
    }
  }
  return {}
}


import { getFilterFromTSV } from '@utils/tsv'
import { ReferenceUtils } from 'bible-reference-rcl'

export function getSupportedBooksFromTSV(tsv) {
  const { refs, items } = getFilterFromTSV(tsv)
  let config = items?.length && items[0]?.Configuration
  config = config && JSON.parse(config)
  const supportedBooks = ReferenceUtils.convertRefsToSupportedBooks(refs) // convert from array of references to structured object
  return { config, supportedBooks }
}


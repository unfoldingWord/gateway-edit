import { ReferenceUtils } from 'bible-reference-rcl'

export default function tsvToJson(tsv) {
  const result = []

  if (tsv) {
    const lines = tsv.trim().split('\n')
    const headers = lines[0].split('\t')

    for (let i = 1; i < lines.length; i++) {
      const obj = {}
      const currentline = lines[i].split('\t')

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j]
      }

      result.push(obj)
    }
  }

  return result
}

export function getFilterFromTSV(tsvData) {
  const items = tsvToJson(tsvData)
  let refs = []
  console.log(items)

  for (const item of items) {
    let references = item.References
    references = references.split(';')

    for (let ref of references) {
      ref = ref.trim()

      if (!refs.includes(ref)) {
        refs.push(ref)
      }
    }
  }

  refs = refs.sort(ReferenceUtils.bibleRefSort)
  console.log(refs)
  return { refs, items }
}

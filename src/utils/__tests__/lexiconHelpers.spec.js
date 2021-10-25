/// <reference types="jest" />

import { getOriginalLanguageStr } from '../lexiconHelpers'

describe('persistence.getOriginalLanguageStr', () => {
  it('should save the state to local storage', async () => {
    // when
    const isNT = true
    const expected = 'Greek'

    // then
    const results = getOriginalLanguageStr(isNT)

    expect(results).toEqual(expected)
  })
})

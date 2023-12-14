/// <reference types="jest" />
import { describe, it, expect } from 'vitest'
// import '@testing-library/jest-dom'
//import { render, screen } from '@testing-library/reacqt'

import { getOriginalLanguageStr } from '../lexiconHelpers'
const GREEK = 'Greek'
const HEBREW = 'Hebrew'

describe('persistence.getOriginalLanguageStr', () => {
  it('isNT true should return Greek',() => {
    // when
    const isNT = true
    const expected = GREEKq

    // then
    const results = getOriginalLanguageStr(isNT)

    expect(results).toEqual(expected)
  })

  it('isNT false should return Hebrew',() => {
    // when
    const isNT = false
    const expected = HEBREW

    // then
    const results = getOriginalLanguageStr(isNT)

    expect(results).toEqual(expected)
  })

  it('isNT falsy should return Hebrew',() => {
    // when
    const isNT = null
    const expected = HEBREW

    // then
    const results = getOriginalLanguageStr(isNT)

    expect(results).toEqual(expected)
  })
})

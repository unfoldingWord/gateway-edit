/// <reference types="jest" />
import '@testing-library/jest-dom'
import _ from 'lodash'
import {
  flattenChecks,
  getSortedListOfChecks,
  getStrongsFromChecks,
} from '../twls'
import checks_jesus from './fixtures/checks_jesus.json'
import checks_G24240 from './fixtures/checks_G24240.json'

describe('getSortedListOfChecks', () => {
  it('ἰησοῦ should match',() => {
    // give
    const checksIndices = _.cloneDeep(checks_jesus)

    // when
    const { checks } = flattenChecks({ 'ἰησοῦ': checksIndices })
    const results = getSortedListOfChecks(checks)

    // then
    expect(results).toMatchSnapshot()
  })

  it('G24240 should match',() => {
    // give
    const checksIndices = _.cloneDeep(checks_G24240)

    // when
    const { checks } = flattenChecks({ 'ἰησοῦ':checksIndices })
    const results = getSortedListOfChecks(checks)

    // then
    expect(results).toMatchSnapshot()
  })
})


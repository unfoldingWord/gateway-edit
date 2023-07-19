/// <reference types="jest" />
import '@testing-library/jest-dom'
import _ from 'lodash'
import _checks from './fixtures/checks.json'
import {getSortedListOfChecks, getStrongsFromChecks} from '../twls'

describe('getSortedListOfChecks', () => {
  it('it should match',() => {
    // give
    const checks = _.cloneDeep(_checks)
    const quoteWords = ['Ἰησοῦ']

    // when
    const results = getSortedListOfChecks(checks, quoteWords)

    // then
    expect(results).toMatchSnapshot()
  })
 })

describe('getStrongsFromChecks', () => {
  it('it should match',() => {
    // give
    const checks = _.cloneDeep(_checks)

    // when
    const results = getStrongsFromChecks(checks)

    // then
    console.log(results)
    expect(results).toMatchSnapshot()
  })
})

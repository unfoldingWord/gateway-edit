/// <reference types="jest" />
import '@testing-library/jest-dom'
import _ from 'lodash'
import checks_jesus from './fixtures/checks_jesus.json'
import checks_G24240 from './fixtures/checks_G24240.json'
import {getSortedListOfChecks, getStrongsFromChecks} from '../twls'

describe('getSortedListOfChecks', () => {
  it('ἰησοῦ should match',() => {
    // give
    const checks = _.cloneDeep(checks_jesus)

    // when
    const results = getSortedListOfChecks(checks)

    // then
    expect(results).toMatchSnapshot()
  })

  it('G24240 should match',() => {
    // give
    const checks = _.cloneDeep(checks_G24240)

    // when
    const results = getSortedListOfChecks(checks)

    // then
    expect(results).toMatchSnapshot()
  })
 })

describe('getStrongsFromChecks', () => {
  it('it should match',() => {
    // give
    const checks = _.cloneDeep(checks_jesus)

    // when
    const results = getStrongsFromChecks(checks)

    // then
    console.log(results)
    expect(results).toMatchSnapshot()
  })
})

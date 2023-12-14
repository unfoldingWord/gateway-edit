/// <reference types="jest" />
import { jest } from '@jest/globals'
// const { parsePage } = require('../pages')

const tests = [
  {
    path: null,
    expected: { },
  },
]

describe('test parsePage', () => {
  tests.forEach(({ path, expected }) => {
    it(`path ${path} should return ${expected}`,() => {
      const results = parsePage(path)

      expect(results).toEqual(expected)
    })
  })
})

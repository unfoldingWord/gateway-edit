/// <reference types="jest" />
import { describe, it, expect } from 'vitest'
import { parsePage } from '../pages'

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

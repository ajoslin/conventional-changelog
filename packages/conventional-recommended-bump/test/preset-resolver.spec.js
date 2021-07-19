'use strict'

const assert = require('assert')
const presetResolver = require('../preset-resolver')

describe('preset-resolver', () => {
  it('rejects if preset package is not a promise, function, or object', () => {
    const result = presetResolver('invalid preset package')

    return result.catch(error => {
      assert.strictEqual(error.message, 'preset package must be a promise, function, or object')
    })
  })

  it('resolves a promise as a promise', () => {
    const result = presetResolver(Promise.resolve(true))

    return result.then(value => {
      assert.strictEqual(value, true)
    })
  })

  it('resolves an object as a promise', () => {
    const result = presetResolver({ answer: 42 })

    return result.then(value => {
      assert.deepStrictEqual(value, { answer: 42 })
    })
  })

  it('resolves a callback function as a promise', () => {
    const presetPackage = cb => cb(null, { answer: 42 })
    const result = presetResolver(presetPackage)

    return result.then(value => {
      assert.deepStrictEqual(value, { answer: 42 })
    })
  })

  it('fails promise if callback function returns error', () => {
    const presetPackage = cb => cb(new Error('an error happened'))
    const result = presetResolver(presetPackage)

    return result.catch(error => {
      assert.deepStrictEqual(error.message, 'an error happened')
    })
  })
})

'use strict'
const promisify = require('util').promisify

module.exports = presetResolver

function presetResolver (presetPackage) {
  // handle traditional node-style callbacks
  if (typeof presetPackage === 'function') {
    return promisify(presetPackage)()
  }

  // handle object literal or Promise instance
  if (typeof presetPackage === 'object') {
    return Promise.resolve(presetPackage)
  }

  return Promise.reject(new Error('preset package must be a promise, function, or object'))
}

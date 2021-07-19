'use strict'
const Q = require('q')
const _ = require('lodash')
const conventionalChangelog = require('./conventional-changelog')
const parserOpts = require('./parser-opts')
const recommendedBumpOpts = require('./conventional-recommended-bump')
const writerOpts = require('./writer-opts')

module.exports = function (parameter) {
  // parameter passed can be either a config object or a callback function
  let config = parameter
  let callback

  if (_.isFunction(parameter)) {
    // parameter is a callback function
    config = {}
    callback = parameter
  }

  const options = presetOpts(config)

  if (!callback) {
    return options
  }

  callback(null, options)
}

function presetOpts (config) {
  return Q.all([
    conventionalChangelog(config),
    parserOpts(config),
    recommendedBumpOpts(config),
    writerOpts(config)
  ]).spread((conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts) => {
    return { conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts }
  })
}

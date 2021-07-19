'use strict'
const _ = require('lodash')
const conventionalChangelog = require('./conventional-changelog')
const parserOpts = require('./parser-opts')
const recommendedBumpOpts = require('./conventional-recommended-bump')
const writerOpts = require('./writer-opts')

module.exports = function (parameter) {
  // parameter passed can be either a config object or a callback function
  if (_.isFunction(parameter)) {
    // parameter is a callback object
    const config = {}
    // FIXME: use presetOpts(config) for callback
    Promise.all([
      conventionalChangelog(config),
      parserOpts(config),
      recommendedBumpOpts(config),
      writerOpts(config)
    ]).then(([conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts]) => {
      parameter(null, { gitRawCommitsOpts: { noMerges: null }, conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts })
    })
  } else {
    const config = parameter || {}
    return presetOpts(config)
  }
}

function presetOpts (config) {
  return Promise.all([
    conventionalChangelog(config),
    parserOpts(config),
    recommendedBumpOpts(config),
    writerOpts(config)
  ]).then(([conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts]) => {
    return { conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts }
  })
}

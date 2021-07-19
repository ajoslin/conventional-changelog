'use strict'
const conventionalChangelog = require('./conventional-changelog')
const parserOpts = require('./parser-opts')
const recommendedBumpOpts = require('./conventional-recommended-bump')
const writerOpts = require('./writer-opts')

module.exports = presetOpts

function presetOpts (cb) {
  Promise.all([conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts])
    .then(([conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts]) => {
      cb(null, { gitRawCommitsOpts: { noMerges: null }, conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts })
    })
}

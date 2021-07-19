'use strict'

const parserOpts = require('./parser-opts')
const writerOpts = require('./writer-opts')

module.exports = function (config) {
  return Promise.all([parserOpts(config), writerOpts(config)])
    .then(([parserOpts, writerOpts]) => {
      return { parserOpts, writerOpts }
    })
}

'use strict'

const promisify = require('util').promisify
const readFile = promisify(require('fs').readFile)
const resolve = require('path').resolve

module.exports = Promise.all([
  readFile(resolve(__dirname, './templates/template.hbs'), 'utf-8'),
  readFile(resolve(__dirname, './templates/header.hbs'), 'utf-8'),
  readFile(resolve(__dirname, './templates/commit.hbs'), 'utf-8')
])
  .then(([template, header, commit]) => {
    const writerOpts = getWriterOpts()

    writerOpts.mainTemplate = template
    writerOpts.headerPartial = header
    writerOpts.commitPartial = commit

    return writerOpts
  })

function getWriterOpts () {
  return {
    transform: (commit) => {
      if (!commit.tag || typeof commit.tag !== 'string') {
        return
      }

      commit.shortHash = commit.hash.substring(0, 7)

      return commit
    },
    groupBy: 'tag',
    commitGroupsSort: 'title',
    commitsSort: ['tag', 'message']
  }
}

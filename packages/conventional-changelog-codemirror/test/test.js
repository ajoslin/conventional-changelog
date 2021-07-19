'use strict'
const conventionalChangelogCore = require('conventional-changelog-core')
const config = require('../')
const expect = require('chai').expect
const through = require('through2')
const fs = require('fs')
const tmp = require('tmp')
const { gitInit, exec } = require('../../../tools/test-tools')

tmp.setGracefulCleanup()
const oldDir = process.cwd()

describe('codemirror preset', function () {
  before(() => {
    const tmpDir = tmp.dirSync()
    process.chdir(tmpDir.name)
    gitInit()
    fs.writeFileSync('test1', '')
    exec('git add --all && git commit -m"[tern addon] Use correct primary when selecting variables"')
    fs.writeFileSync('test2', '')
    exec('git add --all && git commit -m"[tern addon] Fix patch bc026f1 "')
    fs.writeFileSync('test3', '')
    exec('git add --all && git commit -m"[css mode] Add values for property flex-direction"')
    fs.writeFileSync('test4', '')
    exec('git add --all && git commit -m"[stylus mode] Fix highlight class after a $var"')
    fs.writeFileSync('test5', '')
    exec('git add --all && git commit -m"Bad commit"')
  })

  after(() => {
    process.chdir(oldDir)
  })

  it('should work if there is no semver tag', function (done) {
    conventionalChangelogCore({
      config: config
    })
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        chunk = chunk.toString()

        expect(chunk).to.include('### tern')
        expect(chunk).to.include('Use correct primary when selecting variables')
        expect(chunk).to.include('**addon**')
        expect(chunk).to.include('Add values for property flex-direction')
        expect(chunk).to.include('### stylus')

        expect(chunk).to.not.include('Bad')

        done()
      }))
  })
})

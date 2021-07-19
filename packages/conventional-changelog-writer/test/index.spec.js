'use strict'
const conventionalChangelogWriter = require('../')
const dedent = require('dedent')
const expect = require('chai').expect
const mocha = require('mocha')
const describe = mocha.describe
const it = mocha.it
const map = require('lodash/map')
const through = require('through2')
const today = require('dateformat')(new Date(), 'yyyy-mm-dd', true)

const commits = [
  {
    hash: '9b1aff905b638aa274a5fc8f88662df446d374bd',
    header: 'feat(scope): broadcast $destroy event on scope destruction',
    body: null,
    footer: 'Closes #1',
    notes: [{
      title: 'BREAKING NEWS',
      text: 'breaking news'
    }],
    references: [{
      action: 'Closes',
      repository: null,
      issue: '1',
      raw: '#1'
    }, {
      action: 'Closes',
      repository: null,
      issue: '2',
      raw: '#2'
    }, {
      action: 'Closes',
      repository: null,
      issue: '3',
      raw: '#3'
    }]
  },
  {
    hash: '13f31602f396bc269076ab4d389cfd8ca94b20ba',
    header: 'fix(ng-list): Allow custom separator',
    body: 'bla bla bla',
    footer: 'BREAKING CHANGE: some breaking change',
    notes: [{
      title: 'BREAKING CHANGE',
      text: 'some breaking change'
    }],
    references: []
  },
  {
    hash: '2064a9346c550c9b5dbd17eee7f0b7dd2cde9cf7',
    header: 'perf(template): tweak',
    body: 'My body.',
    footer: '',
    notes: [],
    references: []
  },
  {
    hash: '5f241416b79994096527d319395f654a8972591a',
    header: 'refactor(name): rename this module to conventional-changelog-writer',
    body: '',
    footer: '',
    notes: [],
    references: []
  }
]

describe('conventionalChangelogWriter', function () {
  function getStream () {
    const upstream = through.obj()
    for (const commit of commits) {
      upstream.write(commit)
    }
    upstream.end()
    return upstream
  }

  describe('no commits', function () {
    it('should still work if there is no commits', function (done) {
      let i = 0
      const upstream = through.obj()
      upstream.end()
      upstream
        .pipe(conventionalChangelogWriter())
        .pipe(through(function (chunk, enc, cb) {
          expect(chunk.toString()).to.equal('##  (' + today + ')\n\n\n\n\n')

          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })
  })

  describe('link', function () {
    it('should auto link if `context.repository`, `context.commit` and `context.issue` are truthy', function (done) {
      let i = 0
      const context = {
        version: '0.5.0',
        title: 'this is a title',
        host: 'https://github.com',
        repository: 'a/b'
      }
      const changelog = conventionalChangelogWriter.parseArray(commits, context)
      expect(changelog).to.include('https://github.com/a/b/commits/13f3160')
      getStream()
        .pipe(conventionalChangelogWriter(context))
        .pipe(through(function (chunk, enc, cb) {
          expect(chunk.toString()).to.include('https://github.com/a/b/commits/13f3160')
          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })

    it('should auto link if `context.repoUrl`, `context.commit` and `context.issue` are truthy', function (done) {
      let i = 0
      const context = {
        version: '0.5.0',
        title: 'this is a title',
        repoUrl: 'https://github.com/a/b'
      }
      const changelog = conventionalChangelogWriter.parseArray(commits, context)
      expect(changelog).to.include('https://github.com/a/b/commits/13f3160')
      getStream()
        .pipe(conventionalChangelogWriter(context))
        .pipe(through(function (chunk, enc, cb) {
          expect(chunk.toString()).to.include('https://github.com/a/b/commits/13f3160')

          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })

    it('should not auto link', function (done) {
      let i = 0
      const changelog = conventionalChangelogWriter.parseArray(commits, {})
      expect(changelog).to.not.include('https://github.com/a/b/commits/13f3160')
      getStream()
        .pipe(conventionalChangelogWriter())
        .pipe(through(function (chunk, enc, cb) {
          expect(chunk.toString()).to.not.include('https://github.com/a/b/commits/13f3160')

          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })

    it('should not link references', function (done) {
      let i = 0
      const context = {
        version: '0.5.0',
        title: 'this is a title',
        host: 'https://github.com',
        repository: 'a/b',
        linkReferences: false
      }
      const changelog = conventionalChangelogWriter.parseArray(commits, context)
      expect(changelog).to.not.include('https://github.com/a/b/commits/13f3160')
      getStream()
        .pipe(conventionalChangelogWriter(context))
        .pipe(through(function (chunk, enc, cb) {
          expect(chunk.toString()).to.not.include('https://github.com/a/b/commits/13f3160')

          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })
  })

  describe('transform', function () {
    it('should transform the commit with context', function (done) {
      let i = 0
      let called = false
      conventionalChangelogWriter.parseArray(commits, {}, {
        transform: function (commit, context) {
          expect(context).to.eql({
            commit: 'commits',
            issue: 'issues',
            date: today
          })
          called = true
          return commit
        }
      })
      expect(called).to.equal(true)
      getStream()
        .pipe(conventionalChangelogWriter({}, {
          transform: function (commit, context) {
            expect(context).to.eql({
              commit: 'commits',
              issue: 'issues',
              date: today
            })

            return commit
          }
        }))
        .pipe(through(function (chunk, enc, cb) {
          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })

    it('should merge with the provided transform object', function (done) {
      let i = 0
      const changelog = conventionalChangelogWriter.parseArray(commits, {}, {
        transform: {
          notes: function (notes) {
            map(notes, function (note) {
              if (note.title === 'BREAKING CHANGE') {
                note.title = 'BREAKING CHANGES'
              }

              return note
            })

            return notes
          }
        }
      })
      expect(changelog).to.include('13f3160')
      expect(changelog).to.include('BREAKING CHANGES')
      expect(changelog).to.not.include('13f31602f396bc269076ab4d389cfd8ca94b20ba')
      getStream()
        .pipe(conventionalChangelogWriter({}, {
          transform: {
            notes: function (notes) {
              map(notes, function (note) {
                if (note.title === 'BREAKING CHANGE') {
                  note.title = 'BREAKING CHANGES'
                }

                return note
              })

              return notes
            }
          }
        }))
        .pipe(through(function (chunk, enc, cb) {
          chunk = chunk.toString()

          expect(chunk).to.include('13f3160')
          expect(chunk).to.include('BREAKING CHANGES')
          expect(chunk).to.not.include('13f31602f396bc269076ab4d389cfd8ca94b20ba')

          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })

    it('should ignore the commit if tranform returns `null`', function (done) {
      let i = 0
      const changelog = conventionalChangelogWriter.parseArray(commits, {}, {
        transform: function () {
          return false
        }
      })
      expect(changelog).to.equal('##  (' + today + ')\n\n\n\n\n')
      getStream()
        .pipe(conventionalChangelogWriter({}, {
          transform: function () {
            return false
          }
        }))
        .pipe(through(function (chunk, enc, cb) {
          expect(chunk.toString()).to.equal('##  (' + today + ')\n\n\n\n\n')

          i++
          cb(null)
        }, function () {
          expect(i).to.equal(1)
          done()
        }))
    })
  })

  describe('generate', function () {
    const commits = [
      {
        header: 'feat(scope): broadcast $destroy event on scope destruction',
        body: null,
        footer: null,
        notes: [],
        references: [],
        committerDate: '2015-04-07 14:17:05 +1000'
      },
      {
        header: 'fix(ng-list): Allow custom separator',
        body: 'bla bla bla',
        footer: null,
        notes: [],
        references: [],
        version: '1.0.1',
        committerDate: '2015-04-07 15:00:44 +1000'
      },
      {
        header: 'perf(template): tweak',
        body: 'My body.',
        footer: null,
        notes: [],
        references: [],
        committerDate: '2015-04-07 15:01:30 +1000'
      },
      {
        header: 'refactor(name): rename this module to conventional-changelog-writer',
        body: null,
        footer: null,
        notes: [],
        references: [],
        committerDate: '2015-04-08 09:43:59 +1000'
      }
    ]

    function getStream () {
      const upstream = through.obj()
      for (const commit of commits) {
        upstream.write(commit)
      }
      upstream.end()

      return upstream
    }

    it('should generate on the transformed commit', function (done) {
      let i = 0
      const changelog = conventionalChangelogWriter.parseArray(commits, {
        version: '1.0.0'
      }, {
        transform: function (commit) {
          commit.version = '1.0.0'
          return commit
        }
      })
      expect(changelog).to.contain('# 1.0.0 ')
      getStream()
        .pipe(conventionalChangelogWriter({
          version: '1.0.0'
        }, {
          transform: function (commit) {
            commit.version = '1.0.0'
            return commit
          }
        }))
        .pipe(through(function (chunk, enc, cb) {
          expect(chunk.toString()).to.contain('# 1.0.0 ')

          i++
          cb(null)
        }, function () {
          expect(i).to.equal(5)
          done()
        }))
    })

    describe('when commits are not reversed', function () {
      it('should generate on `\'version\'` if it\'s a valid semver', function (done) {
        let i = 0
        const changelog = conventionalChangelogWriter.parseArray(commits)
        expect(changelog).to.include('##  (' + today)
        expect(changelog).to.include('feat(scope): ')
        expect(changelog).to.include('## <small>1.0.1 (2015-04-07)</small>')
        expect(changelog).to.include('fix(ng-list): ')
        expect(changelog).to.include('perf(template): ')
        expect(changelog).to.include('refactor(name): ')
        getStream()
          .pipe(conventionalChangelogWriter())
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.include('##  (' + today)
              expect(chunk).to.include('feat(scope): ')

              expect(chunk).to.not.include('fix(ng-list): ')
              expect(chunk).to.not.include('perf(template): ')
              expect(chunk).to.not.include('refactor(name): ')
            } else {
              expect(chunk).to.include('## <small>1.0.1 (2015-04-07)</small>')
              expect(chunk).to.include('fix(ng-list): ')
              expect(chunk).to.include('perf(template): ')
              expect(chunk).to.include('refactor(name): ')

              expect(chunk).to.not.include('feat(scope): ')
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('`generateOn` could be a string', function (done) {
        let i = 0
        const commits = [
          {
            header: 'feat(scope): broadcast $destroy event on scope destruction',
            body: null,
            footer: null,
            notes: [],
            references: [],
            version: '1.0.1',
            committerDate: '2015-04-07 14:17:05 +1000'
          },
          {
            header: 'fix(ng-list): Allow custom separator',
            body: 'bla bla bla',
            footer: null,
            notes: [],
            references: [],
            version: '2.0.1',
            committerDate: '2015-04-07 15:00:44 +1000'
          },
          {
            header: 'perf(template): tweak',
            body: 'My body.',
            footer: null,
            notes: [],
            references: [],
            committerDate: '2015-04-07 15:01:30 +1000'
          },
          {
            header: 'refactor(name): rename this module to conventional-changelog-writer',
            body: null,
            footer: null,
            notes: [],
            references: [],
            version: '4.0.1',
            committerDate: '2015-04-08 09:43:59 +1000'
          }
        ]
        const upstream = through.obj()
        for (const commit of commits) {
          upstream.write(commit)
        }
        upstream.end()
        const changelog = conventionalChangelogWriter.parseArray(commits, {}, {
          generateOn: 'version'
        })
        expect(changelog).to.include('##  (' + today)
        expect(changelog).to.include('feat(scope): broadcast $destroy event on scope destruction')
        expect(changelog).to.not.include('<a name=""></a>')
        expect(changelog).to.include('fix(ng-list): Allow custom separator')
        expect(changelog).to.include('perf(template): tweak')
        expect(changelog).to.include('refactor(name): rename this module to conventional-changelog-writer')
        expect(changelog).to.include('perf(template): tweak')
        upstream
          .pipe(conventionalChangelogWriter({}, {
            generateOn: 'version'
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.include('##  (' + today)

              expect(chunk).to.not.include('## 1.0.1 (2015-04-07)')
            } else if (i === 1) {
              expect(chunk).to.include('feat(scope): broadcast $destroy event on scope destruction')
              expect(chunk).to.not.include('<a name=""></a>')
            } else if (i === 2) {
              expect(chunk).to.include('fix(ng-list): Allow custom separator')
              expect(chunk).to.include('perf(template): tweak')
            } else if (i === 3) {
              expect(chunk).to.include('refactor(name): rename this module to conventional-changelog-writer')
              expect(chunk).to.not.include('perf(template): tweak')
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(4)
            done()
          }))
      })

      it('`generateOn` could be a function', function (done) {
        let i = 0

        getStream()
          .pipe(conventionalChangelogWriter({}, {
            generateOn: function (commit, commits, context, options) {
              expect(commits.length).to.be.a('number')
              expect(context.commit).to.equal('commits')
              expect(options.groupBy).to.equal('type')

              return commit.version
            }
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.include('##  (' + today)
              expect(chunk).to.not.include('## 1.0.1 (2015-04-07)')
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('`generateOn` could be a null', function (done) {
        let i = 0

        getStream()
          .pipe(conventionalChangelogWriter({}, {
            generateOn: null
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            expect(chunk).to.include('##  (' + today)

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(1)
            done()
          }))
      })

      it('version should fall back on `context.version` and `context.date`', function (done) {
        let i = 0

        const changelog = conventionalChangelogWriter.parseArray(commits, {
          version: '0.0.1',
          date: '2015-01-01'
        })
        expect(changelog).to.include('## <small>0.0.1 (2015-01-01)</small>')
        expect(changelog).to.include('## <small>1.0.1 (2015-04-07)</small>')
        getStream()
          .pipe(conventionalChangelogWriter({
            version: '0.0.1',
            date: '2015-01-01'
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.include('## <small>0.0.1 (2015-01-01)</small>')
            } else {
              expect(chunk).to.include('## <small>1.0.1 (2015-04-07)</small>')
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('should still generate a block even if the commit is ignored', function (done) {
        let i = 0

        getStream()
          .pipe(conventionalChangelogWriter({}, {
            transform: function () {
              return false
            }
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.equal('##  (' + today + ')\n\n\n\n\n')
            } else {
              expect(chunk).to.equal('## <small>1.0.1 (2015-04-07 15:00:44 +1000)</small>\n\n\n\n\n')
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('should include details', function (done) {
        let i = 0
        getStream()
          .pipe(conventionalChangelogWriter({}, {
            includeDetails: true
          }))
          .pipe(through.obj(function (chunk, enc, cb) {
            if (i === 0) {
              expect(chunk.log).to.include('##  (' + today + ')\n\n')
              expect(chunk.log).to.include('feat(scope): broadcast $destroy event on scope destruction')
              expect(chunk.keyCommit).to.eql()
            } else {
              expect(chunk.log).to.include('## <small>1.0.1 (2015-04-07)</small>\n\n')
              expect(chunk.log).to.include('fix(ng-list): Allow custom separator')
              expect(chunk.log).to.include('perf(template): tweak')
              expect(chunk.log).to.include('refactor(name): rename this module to conventional-changelog-writer')
              expect(chunk.keyCommit.body).to.equal('bla bla bla')
              expect(chunk.keyCommit.committerDate).to.equal('2015-04-07')
              expect(chunk.keyCommit.version).to.equal('1.0.1')
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('should not flush when previous release is generated', function (done) {
        let i = 0

        const upstream = through.obj()
        upstream.write({
          header: 'feat(scope): broadcast $destroy event on scope destruction',
          body: null,
          footer: null,
          notes: [{
            title: 'BREAKING CHANGE',
            text: 'No backward compatibility.'
          }],
          references: [],
          committerDate: '2015-04-07 14:17:05 +1000',
          version: 'v1.0.0'
        })
        upstream.write({
          header: 'feat(scope): broadcast $destroy event on scope destruction',
          body: null,
          footer: null,
          notes: [{
            title: 'BREAKING CHANGE',
            text: 'No backward compatibility.'
          }],
          references: [],
          committerDate: '2015-04-07 14:17:05 +1000',
          version: 'v0.1.4'
        })
        upstream.end()

        upstream
          .pipe(conventionalChangelogWriter({
            version: 'v2.0.0'
          }, {
            doFlush: false
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.contain('1.0.0')
              expect(chunk).not.to.contain('2.0.0')
            } else {
              expect(chunk).to.contain('0.1.4')
            }

            i++
            cb()
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('should not flush when it is the only potential release', function (done) {
        const upstream = through.obj()
        upstream.write({
          header: 'feat(scope): broadcast $destroy event on scope destruction',
          body: null,
          footer: null,
          notes: [{
            title: 'BREAKING CHANGE',
            text: 'No backward compatibility.'
          }],
          references: [],
          committerDate: '2015-04-07 14:17:05 +1000'
        })
        upstream.end()

        upstream
          .pipe(conventionalChangelogWriter({
            version: 'v2.0.0'
          }, {
            doFlush: false
          }))
          .pipe(through(function () {
            done(new Error('should not flush when it is the only potential release'))
          }, function () {
            done()
          }))
      })
    })

    describe('when commits are reversed', function () {
      it('should generate on `\'version\'` if it\'s a valid semver', function (done) {
        let i = 0
        const commits = [
          {
            header: 'feat(scope): broadcast $destroy event on scope destruction',
            body: null,
            footer: null,
            notes: [],
            references: [],
            version: '1.0.1',
            committerDate: '2015-04-07 14:17:05 +1000'
          },
          {
            header: 'fix(ng-list): Allow custom separator',
            body: 'bla bla bla',
            footer: null,
            notes: [],
            references: [],
            version: '2.0.1',
            committerDate: '2015-04-07 15:00:44 +1000'
          },
          {
            header: 'perf(template): tweak',
            body: 'My body.',
            footer: null,
            notes: [],
            references: [],
            committerDate: '2015-04-07 15:01:30 +1000'
          },
          {
            header: 'refactor(name): rename this module to conventional-changelog-writer',
            body: null,
            footer: null,
            notes: [],
            references: [],
            version: '4.0.1',
            committerDate: '2015-04-08 09:43:59 +1000'
          }
        ]
        const upstream = through.obj()
        for (const commit of commits) {
          upstream.push(commit)
        }
        upstream.end()
        const changelog = conventionalChangelogWriter.parseArray(commits, {}, {
          reverse: true
        })
        expect(changelog.trim()).to.equal(dedent(`## <small>1.0.1 (2015-04-07)</small>

        * feat(scope): broadcast $destroy event on scope destruction 
        
        
        
        ## <small>2.0.1 (2015-04-07)</small>
        
        * fix(ng-list): Allow custom separator 
        
        
        
        ## <small>4.0.1 (2015-04-07)</small>
        
        * perf(template): tweak 
        * refactor(name): rename this module to conventional-changelog-writer 
        
        
        
        ##  (xxxx-xx-xx)`).replace('xxxx-xx-xx', today))
        upstream
          .pipe(conventionalChangelogWriter({}, {
            reverse: true
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.include('## <small>1.0.1 (2015-04-07)</small>')
              expect(chunk).to.include('feat(scope): ')

              expect(chunk).to.not.include('perf(template): ')
              expect(chunk).to.not.include('refactor(name): ')
            } else if (i === 1) {
              expect(chunk).to.include('## <small>2.0.1 (2015-04-07)</small>')
              expect(chunk).to.include('fix(ng-list): ')

              expect(chunk).to.not.include('feat(scope): ')
            } else if (i === 2) {
              expect(chunk).to.include('#')
              expect(chunk).to.include('perf(template): ')
              expect(chunk).to.include('refactor(name): ')
            } else if (i === 3) {
              expect(chunk).to.include('##  (' + today)
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(4)
            done()
          }))
      })

      it('should still generate a block even if the commit is ignored', function (done) {
        let i = 0

        getStream()
          .pipe(conventionalChangelogWriter({}, {
            transform: function () {
              return false
            },
            reverse: true
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.equal('## <small>1.0.1 (2015-04-07 15:00:44 +1000)</small>\n\n\n\n\n')
            } else {
              expect(chunk).to.equal('##  (' + today + ')\n\n\n\n\n')
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('should include details', function (done) {
        let i = 0

        getStream()
          .pipe(conventionalChangelogWriter({}, {
            reverse: true,
            includeDetails: true
          }))
          .pipe(through.obj(function (chunk, enc, cb) {
            if (i === 0) {
              expect(chunk.log).to.include('## <small>1.0.1 (2015-04-07)</small>\n\n')
              expect(chunk.log).to.include('broadcast $destroy event on scope destruction')
              expect(chunk.log).to.include('fix(ng-list):')
              expect(chunk.keyCommit.version).to.equal('1.0.1')
              expect(chunk.keyCommit.committerDate).to.equal('2015-04-07')
            } else {
              expect(chunk.log).to.include('##  (' + today + ')\n\n')
              expect(chunk.log).to.include('perf(template): tweak')
              expect(chunk.log).to.include('refactor(name): rename this module to conventional-changelog-writer')
              expect(chunk.keyCommit).to.eql()
            }

            i++
            cb(null)
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })

      it('should not flush when previous release is generated', function (done) {
        let i = 0

        const upstream = through.obj()
        upstream.write({
          header: 'feat(scope): broadcast $destroy event on scope destruction',
          body: null,
          footer: null,
          notes: [{
            title: 'BREAKING CHANGE',
            text: 'No backward compatibility.'
          }],
          references: [],
          committerDate: '2015-04-07 14:17:05 +1000',
          version: 'v1.0.0'
        })
        upstream.write({
          header: 'feat(scope): broadcast $destroy event on scope destruction',
          body: null,
          footer: null,
          notes: [{
            title: 'BREAKING CHANGE',
            text: 'No backward compatibility.'
          }],
          references: [],
          committerDate: '2015-04-07 14:17:05 +1000',
          version: 'v2.0.290'
        })
        upstream.end()

        upstream
          .pipe(conventionalChangelogWriter({
            version: 'v2.0.0'
          }, {
            reverse: true,
            doFlush: false
          }))
          .pipe(through(function (chunk, enc, cb) {
            chunk = chunk.toString()

            if (i === 0) {
              expect(chunk).to.contain('1.0.0')
              expect(chunk).not.to.contain('2.0.0')
            } else {
              expect(chunk).to.contain('2.0.290')
            }

            i++
            cb()
          }, function () {
            expect(i).to.equal(2)
            done()
          }))
      })
    })

    it('should not flush when it is the only potential release', function (done) {
      const upstream = through.obj()
      upstream.write({
        header: 'feat(scope): broadcast $destroy event on scope destruction',
        body: null,
        footer: null,
        notes: [{
          title: 'BREAKING CHANGE',
          text: 'No backward compatibility.'
        }],
        references: [],
        committerDate: '2015-04-07 14:17:05 +1000'
      })
      upstream.end()

      upstream
        .pipe(conventionalChangelogWriter({
          version: 'v2.0.0'
        }, {
          reverse: true,
          doFlush: false
        }))
        .pipe(through(function () {
          done(new Error('should not flush when it is the only potential release'))
        }, function () {
          done()
        }))
    })
  })

  it('should ignore the field if it doesn\'t exist', function (done) {
    let i = 0

    const upstream = through.obj()
    upstream.write({
      header: 'bla',
      body: null,
      footer: null,
      notes: []
    })
    upstream.end()
    upstream
      .pipe(conventionalChangelogWriter())
      .pipe(through(function (chunk, enc, cb) {
        expect(chunk.toString()).to.equal('##  (' + today + ')\n\n* bla \n\n\n\n')

        i++
        cb(null)
      }, function () {
        expect(i).to.equal(1)
        done()
      }))
  })

  it('should sort notes on `text` by default', function (done) {
    const upstream = through.obj()
    upstream.write({
      header: 'feat(scope): broadcast $destroy event on scope destruction',
      body: null,
      footer: null,
      notes: [{
        title: 'BREAKING CHANGE',
        text: 'No backward compatibility.'
      }],
      references: [],
      committerDate: '2015-04-07 14:17:05 +1000'
    })
    upstream.write({
      header: 'fix(ng-list): Allow custom separator',
      body: 'bla bla bla',
      footer: null,
      notes: [{
        title: 'BREAKING CHANGE',
        text: 'Another change.'
      }, {
        title: 'BREAKING CHANGE',
        text: 'Some breaking change.'
      }],
      references: [],
      committerDate: '2015-04-07 15:00:44 +1000'
    })
    upstream.end()

    upstream
      .pipe(conventionalChangelogWriter())
      .pipe(through(function (chunk) {
        expect(chunk.toString()).to.match(/Another change.[\w\W]*No backward compatibility.[\w\W]*Some breaking change./)

        done()
      }))
  })

  it('should not error if version is not semver', function (done) {
    getStream()
      .pipe(conventionalChangelogWriter({
        version: 'a.b.c'
      }))
      .on('error', function (err) {
        done(err)
      })
      .pipe(through(function (chunk) {
        expect(chunk.toString()).to.include('a.b.c')

        done()
      }))
  })

  it('should callback with error on transform', function (done) {
    getStream()
      .pipe(conventionalChangelogWriter({}, {
        transform: function () {
          return undefined.a
        }
      }))
      .on('error', function (err) {
        expect(err).to.be.ok // eslint-disable-line no-unused-expressions
        done()
      })
  })

  it('should callback with error on flush', function (done) {
    getStream()
      .pipe(conventionalChangelogWriter({}, {
        finalizeContext: function () {
          return undefined.a
        }
      }))
      .on('error', function (err) {
        expect(err).to.be.ok // eslint-disable-line no-unused-expressions
        done()
      })
  })

  it('should show your final context', function (done) {
    getStream()
      .pipe(conventionalChangelogWriter({}, {
        debug: function (context) {
          expect(context).to.include('Your final context is:\n')
          done()
        }
      }))
  })
})

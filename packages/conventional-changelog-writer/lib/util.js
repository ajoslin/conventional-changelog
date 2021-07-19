'use strict'
const conventionalCommitsFilter = require('conventional-commits-filter')
const Handlebars = require('handlebars')
const semver = require('semver')
const _ = require('lodash')
const stringify = require('json-stringify-safe')

function compileTemplates (templates) {
  const main = templates.mainTemplate
  const headerPartial = templates.headerPartial
  const commitPartial = templates.commitPartial
  const footerPartial = templates.footerPartial
  const partials = templates.partials

  if (_.isString(headerPartial)) {
    Handlebars.registerPartial('header', headerPartial)
  }

  if (_.isString(commitPartial)) {
    Handlebars.registerPartial('commit', commitPartial)
  }

  if (_.isString(footerPartial)) {
    Handlebars.registerPartial('footer', footerPartial)
  }

  _.forEach(partials, function (partial, name) {
    if (_.isString(partial)) {
      Handlebars.registerPartial(name, partial)
    }
  })

  return Handlebars.compile(main, {
    noEscape: true
  })
}

function functionify (strOrArr) {
  if (strOrArr && typeof strOrArr !== 'function') {
    return (a, b) => {
      let str1 = ''
      let str2 = ''
      if (Array.isArray(strOrArr)) {
        for (const key of strOrArr) {
          str1 += a[key] || ''
          str2 += b[key] || ''
        }
      } else {
        str1 += a[strOrArr]
        str2 += b[strOrArr]
      }
      return str1.localeCompare(str2)
    }
  } else {
    return strOrArr
  }
}

function getCommitGroups (groupBy, commits, groupsSort, commitsSort) {
  const commitGroups = []
  const commitGroupsObj = _.groupBy(commits, function (commit) {
    return commit[groupBy] || ''
  })

  _.forEach(commitGroupsObj, function (commits, title) {
    if (title === '') {
      title = false
    }

    if (commitsSort) {
      commits.sort(commitsSort)
    }

    commitGroups.push({
      title: title,
      commits: commits
    })
  })

  if (groupsSort) {
    commitGroups.sort(groupsSort)
  }

  return commitGroups
}

function getNoteGroups (notes, noteGroupsSort, notesSort) {
  const retGroups = []

  _.forEach(notes, function (note) {
    const title = note.title
    let titleExists = false

    _.forEach(retGroups, function (group) {
      if (group.title === title) {
        titleExists = true
        group.notes.push(note)
        return false
      }
    })

    if (!titleExists) {
      retGroups.push({
        title: title,
        notes: [note]
      })
    }
  })

  if (noteGroupsSort) {
    retGroups.sort(noteGroupsSort)
  }

  if (notesSort) {
    _.forEach(retGroups, function (group) {
      group.notes.sort(notesSort)
    })
  }

  return retGroups
}

function processCommit (chunk, transform, context) {
  let commit

  try {
    chunk = JSON.parse(chunk)
  } catch (e) {}

  commit = _.cloneDeep(chunk)

  if (typeof transform === 'function') {
    commit = transform(commit, context)

    if (commit) {
      commit.raw = chunk
    }

    return commit
  }

  _.forEach(transform, function (el, path) {
    let value = _.get(commit, path)

    if (typeof el === 'function') {
      value = el(value, path)
    } else {
      value = el
    }

    _.set(commit, path, value)
  })

  commit.raw = chunk

  return commit
}

function getExtraContext (commits, notes, options) {
  const context = {}

  // group `commits` by `options.groupBy`
  context.commitGroups = getCommitGroups(options.groupBy, commits, options.commitGroupsSort, options.commitsSort)

  // group `notes` for footer
  context.noteGroups = getNoteGroups(notes, options.noteGroupsSort, options.notesSort)

  return context
}

function generate (options, commits, context, keyCommit) {
  let notes = []
  let filteredCommits
  const compiled = compileTemplates(options)

  if (options.ignoreReverted) {
    filteredCommits = conventionalCommitsFilter(commits)
  } else {
    filteredCommits = _.clone(commits)
  }

  _.forEach(filteredCommits, function (commit) {
    _.map(commit.notes, function (note) {
      note.commit = commit

      return note
    })

    notes = notes.concat(commit.notes)
  })

  context = _.merge({}, context, keyCommit, getExtraContext(filteredCommits, notes, options))

  if (keyCommit && keyCommit.committerDate) {
    context.date = keyCommit.committerDate
  }

  if (context.version && semver.valid(context.version)) {
    context.isPatch = context.isPatch || semver.patch(context.version) !== 0
  }

  context = options.finalizeContext(context, options, filteredCommits, keyCommit, commits)
  options.debug('Your final context is:\n' + stringify(context, null, 2))

  return compiled(context)
}

module.exports = {
  compileTemplates: compileTemplates,
  functionify: functionify,
  getCommitGroups: getCommitGroups,
  getNoteGroups: getNoteGroups,
  processCommit: processCommit,
  getExtraContext: getExtraContext,
  generate: generate
}

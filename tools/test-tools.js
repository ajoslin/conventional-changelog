const { execSync } = require('child_process')
const fs = require('fs')

function fixMessage (msg) {
  if (!msg || typeof msg !== 'string') {
    msg = 'Test commit'
  }
  // we need to escape backtick for bash but not for windows
  // probably this should be done in git-dummy-commit or shelljs
  if (process.platform !== 'win32') {
    msg = msg.replace(/`/g, '\\`')
  }
  return `"${msg}"`
}

function prepareMessageArgs (msg) {
  const args = []
  if (Array.isArray(msg)) {
    if (msg.length > 0) {
      for (const m of msg) {
        args.push('-m', fixMessage(m))
      }
    } else {
      args.push('-m', fixMessage())
    }
  } else {
    args.push('-m', fixMessage(msg))
  }
  return args
}

function exec (command) {
  return execSync(command, {
    stdio: 'pipe',
    encoding: 'utf-8'
  })
}

function gitDummyCommit (msg) {
  const args = prepareMessageArgs(msg)

  args.push(
    '--allow-empty',
    '--no-gpg-sign'
  )

  return exec(`git commit ${args.join(' ')}`)
}

function gitInit () {
  fs.mkdirSync('git-templates')
  return exec('git init --template=./git-templates')
}

module.exports = {
  gitDummyCommit,
  gitInit,
  exec
}

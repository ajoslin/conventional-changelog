# Conventional Changelog

[![Build Status](https://travis-ci.org/conventional-changelog/conventional-changelog.svg?branch=master)](https://travis-ci.org/conventional-changelog/conventional-changelog)
[![Codecov](https://codecov.io/gh/conventional-changelog/conventional-changelog/branch/master/graph/badge.svg)](https://codecov.io/gh/conventional-changelog/conventional-changelog)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![community slack](http://devtoolscommunity.herokuapp.com/badge.svg)](http://devtoolscommunity.herokuapp.com)

_Having problems? Want to contribute? Join Our
[Community Slack](http://devtoolscommunity.herokuapp.com)_.

> Generate a CHANGELOG from git metadata

## About this Repo

The conventional-changelog repo is managed as a
[monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md);
it's composed of many npm packages.

The original `conventional-changelog/conventional-changelog` API repo can be
found in [packages/conventional-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog).

## Getting started

It's recommended you use the high level
[standard-version](https://github.com/conventional-changelog/standard-version)
library, which is a drop-in replacement for npm's `version` command, handling
automated version bumping, tagging and CHANGELOG generation.

Alternatively, if you'd like to move towards completely automating your release
process as an output from CI/CD, consider using
[semantic-release](https://github.com/semantic-release/semantic-release)

You can also use one of the plugins if you are already using the tool:

## Plugins Supporting Conventional Changelog

- [grunt](https://github.com/btford/grunt-conventional-changelog)
- [gulp](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/gulp-conventional-changelog)
- [atom](https://github.com/conventional-changelog/atom-conventional-changelog)
- [vscode](https://github.com/axetroy/vscode-changelog-generator)

## Modules Important to Conventional Changelog Ecosystem

- [conventional-changelog-cli](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)
-> The full-featured command line interface.
- [standard-changelog](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/standard-changelog)
-> Command line interface for the angular commit format.
- [conventional-github-releaser](https://github.com/conventional-changelog/conventional-github-releaser)
-> Make a new GitHub release from git metadata.
- [conventional-recommended-bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump)
-> Get a recommended version bump based on conventional commits.
- [conventional-commits-detector](https://github.com/conventional-changelog/conventional-commits-detector)
-> Detect what commit message convention your repository is using.
- [commitizen](https://github.com/commitizen/cz-cli)
-> Simple commit conventions for internet citizens.
- [commitlint](https://github.com/conventional-changelog/commitlint)
-> Lint commit messages.

## Node Support Policy

We only support [Long-Term Support](https://github.com/nodejs/Release)
versions of Node.

We specifically limit our support to LTS versions of Node, not because this
package won't work on other versions, but because we have a limited amount of
time, and supporting LTS offers the greatest return on that investment.

It's possible this package will work correctly on newer versions of Node.
It may even be possible to use this package on older versions of Node,
though that's more unlikely as we'll make every effort to take advantage of
features available in the oldest LTS version we support.

As each Node LTS version reaches its end-of-life we will remove that version
from the `node` `engines` property of our package's `package.json` file.
Removing a Node version is considered a breaking change and will entail the
publishing of a new major version of this package. We will not accept any
requests to support an end-of-life version of Node. Any merge requests or
issues supporting an end-of-life version of Node will be closed.

We will accept code that allows this package to run on newer, non-LTS, versions
of Node. Furthermore, we will attempt to ensure our own changes work on the
latest version of Node. To help in that commitment, our continuous integration
setup runs against all LTS versions of Node in addition the most recent Node
release; called _current_.

JavaScript package managers should allow you to install this package with any
version of Node, with, at most, a warning if your version of Node does not fall
within the range specified by our `node` `engines` property. If you encounter
issues installing this package, please report the issue to your package manager.

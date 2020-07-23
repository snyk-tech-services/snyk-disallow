snyk-disallow
==============

Snyk Disallow tool

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/snyk-disallow.svg)](https://npmjs.org/package/snyk-disallow)
[![CircleCI](https://circleci.com/gh/snyk-tech-services/snyk-disallow/tree/master.svg?style=shield)](https://circleci.com/gh/snyk-tech-services/snyk-disallow/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/snyk-disallow.svg)](https://npmjs.org/package/snyk-disallow)
[![License](https://img.shields.io/npm/l/snyk-disallow.svg)](https://github.com/snyk-tech-services/snyk-disallow/blob/master/package.json)

# Pre-requisites
- Paid plan.\
snyk-disallow uses Snyk APIs, only available in paid plans.

- Dep Graph API enabled for your account (contact us/your Customer Success Manager)

# Installation
<!-- usage -->
```sh-session
$ npm install -g snyk-disallow
```
or 

[Download binary](https://github.com/snyk-tech-services/snyk-disallow/releases)

# Setup
- Create an org `Disallow` in your Snyk group.
- Have your Snyk CLI configured or export SNYK_TOKEN env var with your token (export SNYK_TOKEN=token / set SNYK_TOKEN=token)

# Usage

[![asciicast](https://storage.googleapis.com/snyk-technical-services.appspot.com/snyk-disallow-asciinema-poster.png)](https://asciinema.org/a/QWsTuNeUVf8dw5yn2DcpkArnf)

# Read-only usage
Get a viewer token for the Snyk Group to get a read|test-only token for CI or similar systems. (Ask your Customer Success Manager)

# Typical flow
- create disallow list for corresponding package manager
- add package name + version to the list of your choice
- check projects|org against disallow list(s)

<!-- usagestop -->
## Commands
<!-- commands -->
* `snyk-disallow help [COMMAND]`
* `snyk-disallow list`
* `snyk-disallow create [LISTNAME] [PACKAGEMANAGER]`
* `snyk-disallow add [DEP] [VERSION] [LISTNAME]`
* `snyk-disallow view [LISTNAME]`
* `snyk-disallow check-project [ORGID] [PROJECTID] [LISTNAME (optional)]`
* `snyk-disallow check-org [ORGID] [LISTNAME (optional)]`
* `snyk test --print-deps --json | snyk-disallow test-project [ORGID] [LISTNAME (optional)]`
* `snyk-disallow rm [DEP] [VERSION] [LISTNAME]`
* `snyk-disallow delete [LISTNAME]`



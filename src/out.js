'use strict'

const async = require('async')
const debug = require('debug')('jira-resource')

const addWatchers = require('./addWatchers.js')
const createOrUpdateIssue = require('./createOrUpdateIssue.js')
const processTransitions = require('./processTransitions')
const searchBySummary = require('./searchBySummary.js')

module.exports = (input, baseFileDir, callback) => {
    const source = input.source
    const params = input.params

    debug('Searching for issue: %s', input.params.summary)

    async.waterfall([
        (next) => {
            searchBySummary(baseFileDir, source, params, next)
        },
        (issue, next) => {
            createOrUpdateIssue(baseFileDir, issue, source, params, next)
        },
        (issue, next) => {
            addWatchers(issue, source, params, next)
        },
        (issue, next) => {
            processTransitions(issue, source, params, next)
        }
    ], (error, issue) => {
        let output = null

        if ( issue ) {
            output = {
                version: {
                    ref: issue.key
                }
            }
        } else if ( !error ) {
            error = new Error('Could not create issue.')
        }

        callback(error, output)
    })
}

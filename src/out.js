'use strict'

const _ = require('lodash');
const async = require('async');
const debug = require('debug')('jira-resource');
const fs = require('fs');
const moment = require('moment');
const request = require('request');

const createOrUpdateIssue = require('./createOrUpdateIssue.js');
const processTransitions = require('./processTransitions');
const searchBySummary = require('./searchBySummary.js');

/** Uncomment the below for sexy debug shizzles **/
// require('request-debug')(request);

module.exports = (input, baseFileDir, callback) => {
    const source = input.source;
    const params = input.params;

    debug('Searching for issue: %s', input.params.summary);

    async.waterfall([
        (next) => {
            searchBySummary(source, params, next)
        },
        (issue, next) => {
            createOrUpdateIssue(baseFileDir, issue, source, params, next)
        },
        (issue, next) => {
            processTransitions(issue, source, params, next)
        }
    ], (error, issue) => {
        let output = null;

        if (issue) {
            output = {
                version: {
                    ref: issue.key
                }
            };
        } else if (!error) {
            error = new Error('Could not create issue.');
        }

        callback(error, output);
    });
};


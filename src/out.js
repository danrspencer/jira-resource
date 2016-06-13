'use strict'

const _ = require('lodash');
const async = require('async');
const debug = require('debug')('jira-resource');
const fs = require('fs');
const moment = require('moment');
const request = require('request');

/** Uncomment the below for useful debug shizzles **/
// require('request-debug')(request);

module.exports = (input, callback) => {
    const source = input.source;
    const params = input.params;

    debug('Searching for issue: %s', input.params.summary);

    async.waterfall([
        (next) => {
            searchBySummary(source, params, (error, response, body) => {
                debugResponse(response);
                next(null, body);
            });
        },
        (body, next) => {
            let issueExists = body.issues.length > 0;

            if (!issueExists) {
                debug('Issue doesn\'t exist, creating new issue...');

                createIssue(source, params, (error, response, body) => {
                    if (!body) {
                        // TODO: Better error handling
                        return next(new Error('Could not create issue.'));
                    }

                    debugResponse(response);

                    let issueId = body.id;
                    let issueKey = body.key;

                    next(null, issueId, issueKey);
                });
            } else {
                let issueId = body.issues[0].id;
                let issueKey = body.issues[0].key;

                debug('Issue exists [%s], updating issue...', issueKey);

                updateIssue(issueId, source, params, (error, response) => {
                    debugResponse(response);

                    if (response.statusCode < 200 && 300 <= response.statusCode) {
                        next(new Error());
                        return;
                    }

                    next(null, issueId, issueKey);
                });
            }
        },
        (issueId, issueKey, done) => {
            if (!issueId || !issueKey) {
                return done(null);
            }

            if (!params.transitions) {
                return done(null, issueKey)
            }

            processTrasitions(issueId, source, params, () => {
                done(null, issueKey);
            });
        }
    ], (error, issueKey) => {
        let output = null;

        if (issueKey) {
            output = {
                version: {
                    ref: issueKey
                }
            };
        } else if (!error) {
            error = new Error('Could not create issue.');
        }

        callback(error, output);
    });
};

function searchBySummary(source, params, callback) {
    const searchUrl = source.url + '/rest/api/2/search/';
    const jql = 'project="' + source.project + '" AND summary~"' + params.fields.summary + '" ORDER BY id DESC';

    let search = {
        jql: jql,
        maxResults: 1,
        fields: [
            "key",
            "summary"
        ]
    };

    debug('Sending search: %s', jql);

    request({
        method: 'POST',
        uri: searchUrl,
        auth: {
            username: source.username,
            password: source.password
        },
        json: search
    }, callback);
}

function createIssue(source, params, callback) {
    requestIssue(source.url + "/rest/api/2/issue/", 'POST', source, params, callback);
}

function updateIssue(issueId, source, params, callback) {
    requestIssue(source.url + "/rest/api/2/issue/" + issueId, 'PUT', source, params, callback);
}

function requestIssue(issueUrl, method, source, params, callback) {

    params.fields = _.merge(parseCustomFields(params), params.fields);

    let fields = _(params.fields)
        .mapValues(replaceTextFileString)
        .mapValues(replaceNowString)
        .value();

    fields.project = { key: source.project };
    fields.issuetype = { name: params.issue_type };

    let issue = {
        fields: fields
    };

    debug('Sending issue: %s', JSON.stringify(issue, null, 2));

    request({
        method: method,
        uri: issueUrl,
        auth: {
            username: source.username,
            password: source.password
        },
        json: issue
    }, callback);
}

function processTrasitions(issueId, source, params, callback) {
    const transitionUrl = source.url + '/rest/api/2/issue/' + issueId + '/transitions/';

    async.eachSeries(params.transitions, (nextTransition, next) => {
        processTransition(transitionUrl, nextTransition, source, () => {
            next();
        });
    }, callback);
}

function processTransition(transitionUrl, transitionName, source, callback) {
    async.waterfall([
        (next) => {
            debug('Searching for available transitions...');

            request({
                method: 'GET',
                uri: transitionUrl,
                auth: {
                    username: source.username,
                    password: source.password
                },
                json: true
            }, (error, response, body) => {
                debugResponse(response);
                next(error, body);
            })
        },
        (body, done) => {
            let transitionId = _.filter(body.transitions, (transition) => {
                return transition.name == transitionName
            })[0].id;

            debug('Performing transition: %s (%s)', transitionName, transitionId);

            request({
                method: 'POST',
                uri: transitionUrl,
                auth: {
                    username: source.username,
                    password: source.password
                },
                json: {
                    transition: {
                        id: transitionId
                    }
                }
            }, (error, response) => {
                debugResponse(response);
                done(error);
            });
        }
    ], callback);
}

function replaceTextFileString(value) {
    if (typeof(value) != 'object') {
        return value;
    }

    let filePath = process.cwd() + '/' + value.file;
    let fileContent;

    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch(error) {
        fileContent = '--Error loading file--';
    }

    return value.text
        ? value.text.replace('$FILE', fileContent)
        : fileContent;
}

function replaceNowString(value) {
    return value.replace(/\$NOW([-+][0-9]+)?([ywdhms])?/, (match, change, unit) => {
        let date = moment();

        unit = unit || 'm';

        if (change) {
            date = date.add(change, unit);
        }

        return date.format();
    });
}

function parseCustomFields(params) {
    if (!params.custom_fields) {
        return {};
    }

    return _(params.custom_fields)
        .mapKeys((value) => {
            return 'customfield_' + value.id
        })
        .mapValues((value) => {
            return value.value
        })
        .value();
}

function debugResponse(response) {
    debug(
        'Response: (%s) %s',
        response.statusCode,
        response.body ? JSON.stringify(response.body, null, 2) : '-empty body-'
    );
}

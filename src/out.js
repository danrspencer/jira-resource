
const _ = require('lodash');
const debug = require('debug')('jira-resource');
const moment = require('moment');
const request = require('request');

/** Uncomment the below for useful debug shizzles **/
//require('request-debug')(request);

module.exports = (input, callback) => {
    const source = input.source;
    const params = input.params;

    debug('Searching for issue: %s', input.params.summary);

    searchBySummary(source, params, (error, response, body) => {

        debugResponse(response);

        let issueExists = body.issues.length == 0;

        if (issueExists) {
            debug('Issue doesn\'t exist, creating new issue...');

            createIssue(source, params, (error, response, body) => {
                if (!body) {
                    // TODO: Better error handling
                    return callback();
                }

                debugResponse(response);

                callback({
                    version: {
                        issue: body.key
                    }
                });
            });
        } else {
            let issueId = body.issues[0].id;
            let issueKey = body.issues[0].key;

            debug('Issue exists [%s], updating issue...', issueKey);

            updateIssue(issueId, source, params, (error, response, body) => {
                debugResponse(response);

                processTrasitions(issueId, source, params, () => {
                    callback({
                        version: {
                            issue: issueKey
                        }
                    });
                });
            });
        }
    });
};

function searchBySummary(source, params, callback) {
    const searchUrl = source.url + '/rest/api/2/search/';
    const jql = 'project="' + source.project + '" AND summary~"' + params.summary + '" ORDER BY id DESC';

    let search = {
        jql: jql,
        maxResults: 1,
        fields: [
            "key",
            "summary"
        ]
    };

    debug('Sending search: %s', JSON.stringify(search, null, 2));

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

    let issue = {
        fields: {
            project: {
                key: source.project
            },
            issuetype: {
                name: params.issue_type
            }
        }
    };

    params = parseCustomFields(params);

    issue.fields = _(params).omit([ 'issue_type', 'custom_fields', 'transitions' ])
        .mapValues(replaceNowString)
        .merge(issue.fields);

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

    if (!params.transitions) {
        callback();
    }

    request({
        method: 'GET',
        uri: transitionUrl,
        auth: {
            username: source.username,
            password: source.password
        },
        json: true
    }, (error, response, body) => {
        let transitionId = _.filter(body.transitions, (transition) => {
            return transition.name == params.transitions[0]
        })[0].id;

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
        }, callback);
    });
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

function debugResponse(response, body) {
    debug(
        'Result: (%s) %s',
        response.statusCode,
        JSON.stringify(response.body || {}, null, 2)
    );
}

function parseCustomFields(params) {
    if (!params.custom_fields) {
        return params;
    }

    return _(params.custom_fields)
        .mapKeys((value) => {
            return 'customfield_' + value.id
        })
        .mapValues((value) => {
            return value.value
        })
        .merge(params);
}

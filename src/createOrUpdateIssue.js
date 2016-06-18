'use strict'

const _ = require('lodash');
const debug = require('debug')('jira-resource');
const moment = require('moment');
const request = require('request');

const debugResponse = require('./debugResponse.js');
const replaceTextFileString = require('./replaceTextFileString.js');

module.exports = (baseFileDir, existingIssue, source, params, callback) => {

    if (existingIssue) {
        return updateIssue((error) => {
            callback(error, existingIssue)
        });
    }

    return createIssue((error, newIssue) => {
        callback(error, newIssue)
    });

    function createIssue(done) {
        debug('Issue doesn\'t exist, creating new issue...');

        return requestIssue(source.url + "/rest/api/2/issue/", 'POST', (error, response, body) => {
            if (!error && !body) {
                return done(new Error('Could not create issue.'));
            }

            done(error, body);
        });
    }

    function updateIssue(done) {
        let issueId = existingIssue.id;
        let issueKey = existingIssue.key;

        debug('Issue exists [%s], updating issue...', issueKey);

        return requestIssue(source.url + "/rest/api/2/issue/" + issueId, 'PUT', done);
    }

    function requestIssue(issueUrl, method, callback) {

        let issue = {
            fields: processFields()
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
        }, (error, response, body) => {
            if (error) {
                return callback(error);
            }

            debugResponse(response);

            if (response.statusCode < 200 || 300 <= response.statusCode) {
                return callback(new Error('Could not update Jira.'));
            }

            callback(error, response, body);
        });
    }

    function processFields() {
        let fields = params.fields || {};

        fields.summary = params.summary;

        fields = _.merge(parseCustomFields(params), fields);

        fields = _(fields)
            .mapValues((value) => {
                return replaceTextFileString(baseFileDir, value)
            })
            .mapValues(replaceNowString)
            .value();

        fields.project = {key: source.project};

        if (params.issue_type) {
            fields.issuetype = {name: params.issue_type};
        }

        return fields;
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
};
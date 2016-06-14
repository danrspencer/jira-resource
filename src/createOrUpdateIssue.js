
const _ = require('lodash');
const debug = require('debug')('jira-resource');
const fs = require('fs');
const moment = require('moment');
const request = require('request');

const debugResponse = require('./debugResponse.js');

module.exports = (baseFileDir, existingIssue, source, params, callback) => {

    if (existingIssue) {
        return updateIssue(callback);
    }

    return createIssue(callback);

    function createIssue(done) {
        debug('Issue doesn\'t exist, creating new issue...');

        return requestIssue(source.url + "/rest/api/2/issue/", 'POST', (error, response, body) => {
            //if (error) {
            //    return done(error);
            //}

            if (!body) {
                return done(new Error('Could not create issue.'));
            }

            debugResponse(response);

            //if (response.statusCode < 200 && 300 <= response.statusCode) {
            //    return done(new Error());
            //}

            done(null, body);
        });
    }

    function updateIssue(done) {
        let issueId = existingIssue.id;
        let issueKey = existingIssue.key;

        debug('Issue exists [%s], updating issue...', issueKey);

        return requestIssue(source.url + "/rest/api/2/issue/" + issueId, 'PUT', (error, response, body) => {
            //if (error) {
            //    return done(error);
            //}

            //if (!body) {
            //    return done(new Error('Could not create issue.'));
            //}

            debugResponse(response);

            if (response.statusCode < 200 && 300 <= response.statusCode) {
                return done(new Error());
            }

            done(null, existingIssue);
        });
    }

    function requestIssue(issueUrl, method, callback) {

        let fields = _(params.fields)
            .mapValues(replaceTextFileString)
            .mapValues(replaceNowString)
            .value();

        fields = _.merge(parseCustomFields(params), fields);

        fields.summary = params.summary;
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

    function replaceTextFileString(value) {
        if (typeof(value) != 'object') {
            return value;
        }

        let filePath = baseFileDir + '/' + value.file;
        let fileContent;

        //try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
        //} catch(error) {
        //    fileContent = '--Error loading file--';
        //}

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
};
const _ = require('lodash');
const debug = require('debug')('jira-resource');
const moment = require('moment');
const request = require('request');

const debugResponse = require('./debugResponse.js');
const replaceTextFileString = require('./replaceTextFileString.js');
const customFieldFactory = require('./customFieldFactory.js')();

module.exports = (baseFileDir, existingIssue, source, params, callback) => {
  if (existingIssue) {
    return updateIssue((error) => {
      callback(error, existingIssue);
    });
  }

  // check before create issue
  if (!params.summary) {
    return done(new Error('"summary" field is required for creating new issue.'));
  }

  return createIssue((error, newIssue) => {
    callback(error, newIssue);
  });

  function createIssue(done) {
    debug('Issue doesn\'t exist, creating new issue...');

    return requestIssue(source.url + '/rest/api/2/issue/', 'POST', (error, response, body) => {
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

    return requestIssue(source.url + '/rest/api/2/issue/' + issueId, 'PUT', done);
  }

  function requestIssue(issueUrl, method, callback) {
    let issue = {
      fields: processFields()
    };

    debug('Sending issue: %s', JSON.stringify(issue, null, 2));

    request(
      {
        method: method,
        uri: issueUrl,
        auth: {
          username: source.username,
          password: source.password
        },
        json: issue
      },
      (error, response, body) => {
        if (error) {
          return callback(error);
        }

        debugResponse(response);

        if (response.statusCode < 200 || 300 <= response.statusCode) {
          return callback(new Error('Could not update Jira.'));
        }

        callback(error, response, body);
      }
    );
  }

  function processFields() {
    const standardFields = params.fields || {};

    if (params.summary) {
      standardFields.summary = params.summary;
    }

    const customFields = parseCustomFields(params);
    const nonExpandableCustomFields = _.pickBy(customFields, (value) => {
      return typeof value === 'object';
    });
    const expandableCustomFields = _.pickBy(customFields, (value) => {
      return typeof value !== 'object';
    });
    const expandableFields = _.merge(expandableCustomFields, standardFields);

    const expandedFields = _(expandableFields)
      .mapValues((value) => {
        return replaceTextFileString(baseFileDir, value);
      })
      .mapValues(replaceNowString)
      .value();

    const fields = _.merge(nonExpandableCustomFields, expandedFields);

    fields.project = { key: source.project };

    if (params.issue_type) {
      fields.issuetype = { name: params.issue_type };
    }
    if (params.parent) {
      fields.parent = { key: params.parent };
    }

    return fields;
  }

  function replaceNowString(value) {
    value = String(value);

    return value.replace(/\$NOW([-+][0-9]+)?([ywdhms])?/, (match, change, unit) => {
      let date = moment();

      unit = unit || 'm';

      if (change) {
        date = date.add(change, unit);
      }

      return date.format();
    });
  }

  function makeSelectListCustomFieldApiPayload(customField) {
    if (value.value_id) {
      return { id: value.value_id };
    }

    return { value: value.value };
  }

  function parseCustomFields(params) {
    if (!params.custom_fields) {
      return {};
    }

    return _(params.custom_fields)
      .mapKeys((value) => 'customfield_' + value.id)
      .mapValues((value) => customFieldFactory.buildCustomField(value).toApiPayload())
      .value();
  }
};

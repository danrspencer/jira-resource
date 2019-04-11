const _ = require('lodash');
const debug = require('debug')('jira-resource');
const requestIssue = require('./utils/requestIssue.js');

module.exports = (baseFileDir, existingIssue, source, params, callback) => {

  return updateIssue((error) => {
    callback(error, existingIssue);
  });

  function updateIssue(done) {
    let issueId = existingIssue.id;
    let issueKey = existingIssue.key;

    debug('Issue exists [%s], updating issue...', issueKey);

    return requestIssue(baseFileDir, source, params, source.url + '/rest/api/2/issue/' + issueId, 'PUT', done);
  }
};

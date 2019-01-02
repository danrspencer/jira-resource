const debug = require('debug')('jira-resource');
const request = require('request');

const debugResponse = require('./debugResponse.js');
const replaceTextFileString = require('./replaceTextFileString.js');

module.exports = (baseFileDir, source, params, callback) => {

  const searchUrl = source.url + '/rest/api/2/search/';
  let jql = null;
  if (params.issue_key) {
    debug('Searching for issue by key: %s', params.issue_key);
    const issue_key = replaceTextFileString(baseFileDir, params.issue_key);
    jql = 'project="' + source.project + '" AND key="' + issue_key + '" ORDER BY id DESC';
  } else {
    debug('Searching for issue by summary: %s', params.summary);
    const summary = replaceTextFileString(baseFileDir, params.summary);
    jql = 'project="' + source.project + '" AND summary~"' + summary + '" ORDER BY id DESC';
  }

  let search = {
    jql: jql,
    maxResults: 1,
    fields: ['key', 'summary']
  };

  debug('Sending search: %s', jql);

  request(
    {
      method: 'POST',
      uri: searchUrl,
      auth: {
        username: source.username,
        password: source.password
      },
      json: search
    },
    (error, response, body) => {
      if (error) {
        callback(error);
      }

      debugResponse(response);

      let issue = body.issues[0];

      callback(null, issue);
    }
  );
};

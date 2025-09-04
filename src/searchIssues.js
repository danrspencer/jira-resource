const debug = require('debug')('jira-resource');
const util = require('util');
const request = require('request');

const debugResponse = require('./utils/debugResponse.js');
const replaceTextFileString = require('./utils/replaceTextFileString.js');
const replaceEnvVarString = require('./utils/replaceEnvVarString.js');


function generateFilterStr(params) {
  let custom_filters = [];
  if (params.search_filters && Object.keys(params.search_filters).length != 0) {
    for (f_key in params.search_filters) {
      let f_val = params.search_filters[f_key];
      custom_filters.push(util.format('%s="%s"', f_key, f_val))
    }
  }

  let custom_filters_str = "";
  if (custom_filters.length > 0) {
    custom_filters_str = "AND " + custom_filters.join(" AND ");
  }

  return custom_filters_str
}


function searchByIssueKey(baseFileDir, source, params, custom_filter_str) {
  const issue_key = replaceTextFileString(baseFileDir, params.issue_key);
  debug('Searching for issue by key: %s', issue_key);

  let jql = null;
  let maxResults = issue_key.split(",").length;
  if (maxResults > 1) {
    jql = util.format(
      'project="%s" AND key IN (%s) %s ORDER BY id DESC',
      source.project,
      issue_key,
      custom_filter_str
    )
  } else {
    jql = util.format(
      'project="%s" AND key="%s" %s ORDER BY id DESC',
      source.project,
      issue_key,
      custom_filter_str
    )
  }
  return [jql, maxResults]
}

function searchBySummary(baseFileDir, source, params, custom_filter_str) {
  const summary = replaceEnvVarString(replaceTextFileString(baseFileDir, params.summary));
  debug('Searching for issue by summary: %s', summary);

  let jql = util.format(
    'project="%s" AND summary~"%s" %s ORDER BY id DESC',
    source.project,
    summary,
    custom_filter_str
  )
  let maxResults = 1;
  return [jql, maxResults]
}

module.exports = (baseFileDir, source, params, callback) => {
  const searchUrl = source.url + '/rest/api/3/search/jql';

  let custom_filter_str = generateFilterStr(params);

  let jql = null;
  let maxResults = 0;
  if (params.issue_key) {
    [jql, maxResults] = searchByIssueKey(baseFileDir, source, params, custom_filter_str);
  } else {
    [jql, maxResults] = searchBySummary(baseFileDir, source, params, custom_filter_str);
  }
  let search = {
    jql: jql,
    maxResults: maxResults,
    fields: ['key', 'summary']
  };

  debug('Sending search: %s', jql);

  request(
    {
      method: 'POST',
      uri: searchUrl,
      auth: {
        username: source.email,
        password: source.apitoken
      },
      json: search
    },
    (error, response, body) => {
      debugResponse(response);

      if (error) {
        callback(error);
      } else if (!error && !body) {
        return callback(new Error('Search issue failed.'));
      }

      callback(null, body.issues);
    }
  );
};

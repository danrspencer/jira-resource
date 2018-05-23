const debug = require('debug')('jira-resource')
const request = require('request')

const debugResponse = require('./debugResponse.js')
const replaceTextFileString = require('./replaceTextFileString.js')

module.exports = (baseFileDir, source, params, callback) => {
    debug('Searching for issue: %s', params.summary)

    const searchUrl = source.url + '/rest/api/2/search/'
    const summary = replaceTextFileString(baseFileDir, params.summary)
    const jql = 'project="' + source.project + '" AND summary~"' + summary + '" ORDER BY id DESC'

    let search = {
        jql:        jql,
        maxResults: 1,
        fields:     [
            'key',
            'summary'
        ]
    }

    debug('Sending search: %s', jql)

    request({
        method: 'POST',
        uri:    searchUrl,
        auth:   {
            username: source.username,
            password: source.password
        },
        json:   search
    }, (error, response, body) => {
        if ( error ) {
            callback(error)
        }

        debugResponse(response)

        let issue = body.issues[0]

        callback(null, issue)
    })
}

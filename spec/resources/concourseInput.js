const jira = require('./jiraDetails.js')

module.exports = () => {
    return {
        params: {
            issue_type: 'Bug',
            summary:    'TEST 1.106.0',
            fields:     {
                description: 'Inline static description'
            }
        },
        source: {
            url:      jira.url,
            username: jira.user,
            password: jira.pass,
            project:  'ATP'
        }
    }
}

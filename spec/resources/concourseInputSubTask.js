const jira = require('./jiraDetails.js')

module.exports = () => {
    return {
        params: {
            parent:     'ATP-1',
            issue_type: 'Sub: Task',
            summary:    'Test sub task',
            fields:     {
                description: 'Inline static description for sub task'
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

'use strict'

const chai = require('chai')
const expect = chai.expect

const nock = require('nock')
const out = require('../src/out.js')

const searchBySummary = require('../src/searchBySummary.js')

const jira = require('./resources/jiraDetails.js')
const concourseInput = require('./resources/concourseInput.js')

nock.disableNetConnect()

describe('searchBySummary', () => {

    beforeEach(() => {
        nock.cleanAll()
    })

    it('checks for an existing issue', (done) => {
        let search = setupSearch()

        out(concourseInput(), '', () => {
            expect(search.isDone()).to.be.true
            done()
        })
    })
})

function setupSearch (issues, summary) {
    issues = issues || []
    summary = summary || 'TEST 1.106.0'

    return nock(jira.url)
        .post('/rest/api/2/search/', {
            jql:        'project="ATP" AND summary~"' + summary + '" ORDER BY id DESC',
            maxResults: 1,
            fields:     [
                'key',
                'summary'
            ]
        })
        .basicAuth({
            user: jira.user,
            pass: jira.pass
        })
        .reply(200, {
            expand:     'names,schema',
            startAt:    0,
            maxResults: 1,
            total:      issues.length,
            issues:     issues
        })
}

const chai = require("chai");
const expect = chai.expect;

const nock = require("nock");
const out = require("../src/out.js");

const jira = require("./resources/jiraDetails.js");
const concourseInput = require("./resources/concourseInput.js");

nock.disableNetConnect();

describe("searchBySummary", () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    it("checks for an existing issue by summary", done => {
        let input = concourseInput();

        let search = setupSearch({
            jql: 'project="ATP" AND summary~"' + input.params.summary + '" ORDER BY id DESC',
            maxResults: 1,
            fields: ["key", "summary"]
        });

        out(input, "", () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });
});


describe("searchByIssueKey", () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    it("checks for an existing issue by issue key", done => {
        let input = concourseInput();
        input.params.issue_key = "BUILD-1";

        let search = setupSearch({
            jql: 'project="ATP" AND key="' + input.params.issue_key + '" ORDER BY id DESC',
            maxResults: 1,
            fields: ["key", "summary"]
        });

        out(input, "", () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });
});


function setupSearch(expectedBody) {
    issues = [];

    return nock(jira.url)
        .post("/rest/api/2/search/", expectedBody)
        .basicAuth({
            user: jira.user,
            pass: jira.pass
        })
        .reply(200, {
            expand: "names,schema",
            startAt: 0,
            maxResults: 1,
            total: issues.length,
            issues: issues
        });
}

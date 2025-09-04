const chai = require("chai");
const expect = chai.expect;

const nock = require("nock");
const out = require("../src/out.js");

const jira = require("./resources/jiraDetails.js");
const concourseInput = require("./resources/concourseInput.js");

nock.disableNetConnect();

describe("search", () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    it("search by summary", done => {
        let input = concourseInput();

        let search = setupSearch({
            jql: 'project="ATP" AND summary~"' + input.params.summary + '"  ORDER BY id DESC',
            maxResults: 1,
            fields: ["key", "summary"]
        });

        out(input, "", () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });


    it("search by issue_key", done => {
        let input = concourseInput();
        input.params.issue_key = "BUILD-1";

        let search = setupSearch({
            jql: 'project="ATP" AND key="' + input.params.issue_key + '"  ORDER BY id DESC',
            maxResults: 1,
            fields: ["key", "summary"]
        });

        out(input, "", () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });


    it("search by issue_key and search_filters", done => {
        let input = concourseInput();
        input.params.issue_key = "BUILD-1";
        input.params.search_filters = {
            status: "Done"
        }

        let search = setupSearch({
            jql: 'project="ATP" AND key="' + input.params.issue_key + '" AND status="Done" ORDER BY id DESC',
            maxResults: 1,
            fields: ["key", "summary"]
        });

        out(input, "", () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });


    it("search by multiple issue_key and search_filters", done => {
        let input = concourseInput();
        input.params.issue_key = "BUILD-1,BUILD-2";
        input.params.search_filters = {
            status: "Done"
        }

        let search = setupSearch({
            jql: 'project="ATP" AND key IN (' + input.params.issue_key + ') AND status="Done" ORDER BY id DESC',
            maxResults: 2,
            fields: ["key", "summary"]
        });

        out(input, "", () => {
            expect(search.isDone()).to.be.true;
            done();
        });
    });

    it("search by summary and search_filters", done => {
        let input = concourseInput();
        input.params.summary = "Test summary";
        input.params.search_filters = {
            status: "Done"
        }

        let search = setupSearch({
            jql: 'project="ATP" AND summary~"' + input.params.summary + '" AND status="Done" ORDER BY id DESC',
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
        .post("/rest/api/3/search/jql", expectedBody)
        .basicAuth({
            user: jira.user,
            pass: jira.token
        })
        .reply(200, {
            expand: "names,schema",
            startAt: 0,
            maxResults: 1,
            total: issues.length,
            issues: issues
        });
}

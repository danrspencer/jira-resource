const chai = require("chai");
const expect = chai.expect;

const nock = require("nock");

const addComments = require("../src/addComments.js");

const jira = require("./resources/jiraDetails.js");
const concourseInput = require("./resources/concourseInput.js");

nock.disableNetConnect();

describe("addComments", () => {
    let issue = {
        id: "15805",
        key: "ATP-1",
        self: jira.url + "rest/api/2/issue/15805"
    };

    beforeEach(() => {
        nock.cleanAll();
    });

    it("adds a comment a new issue", done => {
        let input = concourseInput();
        input.params.comments = [{content: "new comment"}];

        let addComment = nock(jira.url)
            .post("/rest/api/2/issue/15805/comment/", {body: "new comment"})
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(201);

        addComments("", issue, input.source, input.params, () => {
            expect(addComment.isDone()).to.be.true;
            done();
        });
    });

    it("adds multiple comments", done => {
        let input = concourseInput();
        input.params.comments = [
            {content: "new comment 1"},
            {content: "new comment 2"},
            {content: "new comment 3"},
        ];

        let addComment = nock(jira.url)
            .post("/rest/api/2/issue/15805/comment/", {body: "new comment 1"})
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(201)
            .post("/rest/api/2/issue/15805/comment/", {body: "new comment 2"})
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(201)
            .post("/rest/api/2/issue/15805/comment/", {body: "new comment 3"})
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(201);

        addComments("", issue, input.source, input.params, () => {
            expect(addComment.isDone()).to.be.true;
            done();
        });
    });
});

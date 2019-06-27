const chai = require("chai");
const expect = chai.expect;

const nock = require("nock");

const addWatchers = require("../src/addWatchers.js");

const jira = require("./resources/jiraDetails.js");
const concourseInput = require("./resources/concourseInput.js");

nock.disableNetConnect();

describe("addWatchers", () => {
    let issue = {
        id: "15805",
        key: "ATP-1",
        self: jira.url + "rest/api/2/issue/15805"
    };

    beforeEach(() => {
        nock.cleanAll();
    });

    it("adds a watcher a new issue", done => {
        let input = concourseInput();
        input.params.watchers = ["user1"];

        let addWatcher = nock(jira.url)
            .post("/rest/api/2/issue/15805/watchers/", '"user1"')
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204);

        addWatchers(issue, input.source, input.params, () => {
            expect(addWatcher.isDone()).to.be.true;
            done();
        });
    });

    it("adds multiple watchers", done => {
        let input = concourseInput();
        input.params.watchers = ["user1", "user2", "user3"];

        let addWatcher = nock(jira.url)
            .post("/rest/api/2/issue/15805/watchers/", '"user1"')
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204)
            .post("/rest/api/2/issue/15805/watchers/", '"user2"')
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204)
            .post("/rest/api/2/issue/15805/watchers/", '"user3"')
            .basicAuth({
                user: jira.user,
                pass: jira.token
            })
            .reply(204);

        addWatchers(issue, input.source, input.params, () => {
            expect(addWatcher.isDone()).to.be.true;
            done();
        });
    });
});

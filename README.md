Jira Ticket Resource
===================================

Resource Type Configuration
---------------------------

```yaml
- name: update-jira
  plan:
  - get: jira-resource
  - put: jira
    params:
      issue_type: Change
      summary: Build v1.0.1
      fields:
        description: With some text
```

Source Configuration
--------------------

To setup an [Incoming Webhook](https://api.slack.com/incoming-webhooks) go to https://my.slack.com/services/new/incoming-webhook/.

-	`url`: *Required.* The webhook URL as provided by Slack. Usually in the form: `https://hooks.slack.com/services/XXXX`

```yaml
resources:
- name: jira
  type: jira-resource
  source:
    url: https://xxxxx.atlassian.net
    username: xxxxx
    password: xxxxx
    project: APROJECT
      

resource_types:
- name: jira
  type: docker-image
  source:
    repository: danrspencer/jira-resource
    tag: latest
```

Behavior
--------

### `out`: Creates, updates and transitions a Jira ticket

#### Parameters

TODO

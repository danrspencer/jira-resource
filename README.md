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

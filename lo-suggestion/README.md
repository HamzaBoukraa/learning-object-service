# Learning Outcome Suggestion Service

Suggest CLARK learning outcomes which relate to a text argument you provide.

## Connection

```javascript
var uri = "http://"+process.env["CLARK_LO_SUGGESTION_IP"]+":"+process.env["CLARK_LO_SUGGESTION_PORT"];
var client = require('socket.io-client')(uri);
```

## Event API

#### suggestOutcomes
`client.emit('suggestOutcomes', text, (outcomes)=>{...});`
Name | Type | Description
---|---|---
`text`|`string`|the text argument
`outcomes`|`OutcomeSuggestion[]`|an array of outcome suggestion documents
# Learning Outcome Suggestion Service

Suggest CLARK learning outcomes which relate to a text argument you provide.

## Connection

```javascript
var uri = "http://"+process.env["CLARK_LO_SUGGESTION_IP"]+":"+process.env["CLARK_LO_SUGGESTION_PORT"];
var client = require('socket.io-client')(uri);
```

## Event API

#### suggestOutcomes
`client.emit('suggestOutcomes', text, filter, (outcomes)=>{...});`

Name | Type | Description
---|---|---
`text`|`string`|the text argument
`outcomes`|`OutcomeSuggestion[]`|an array of outcome suggestion documents
`filter`|`{[prop:string]:string}`|object with string values to filter on

## Filter Behavior
Say `filter` looks like this:
```javascript
filter = {
    author: "NCWF",
    name: "0001",
    ignoreme: "foo",
}
```
`outcomes` will only contain outcomes whose `author` field contains the text "NCWF" and whose `name` field contains the text "0001". The outcomes need only _contain_ the text; it need not be an exact match. Thus, `outcomes` may contain documents with `author` "NCWF" _or_ "NCWF Tasks", as long as its `name` has "0001" in it. The `ignoreme` field does not exist in an outcome suggestion document, so it is ignored.
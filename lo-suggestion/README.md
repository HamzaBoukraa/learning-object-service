# Learning Outcome Suggestion Service

Suggest CLARK learning outcomes which relate to a text argument you provide.

## Connection

```javascript
var uri = "http://"+process.env["CLARK_LO_SUGGESTION_IP"]+":"+process.env["CLARK_LO_SUGGESTION_PORT"];
var client = require('socket.io-client')(uri);
```

## (temporary) POST request API

### `/suggestOutcomes`
Request | []() | []()
---|---|---
`text`|`string`|the text argument
`filter`|`{[prop:string]:string}`|object with string values to filter on

Response| []() | []()
---|---|---
[]()|`OutcomeSuggestion[]`|an array of outcome suggestion documents
`error`|`string`|exists only if an error occurred

### `/authenticate`
Request | []() | []()
---|---|---
`text`|`string`|the text argument
`filter`|`{[prop:string]:string}`|object with string values to filter on

Response| []() | []()
---|---|---
[]()|`LearningObject[]*`|an array of outcome suggestion documents
`error`|`string`|exists only if an error occurred

`*` The array consists of serialized `LearningObject`s. Unserialize with the `map` function:
```javascript
let objects: LearningObject[] = response.body.map((a:string)=>{return LearningObject.unserialize(a,null)});
```

## Event API

#### fetchAllObjects
`client.emit('suggestOutcomes', (err, objects)=>{...})`

Name | Type | Description
---|---|---
`objects`|`LearningObject[]*`|an array of serialized learning objects
`err`|`string`|an error message, or null if everything worked

`*` Unserialize `objects` with map function:
```javascript
objects = objects.map((a)=>{return LearningObject.unserialize(a,null)});
```

#### suggestOutcomes
`client.emit('suggestOutcomes', text, filter, (err, outcomes)=>{...});`

Name | Type | Description
---|---|---
`text`|`string`|the text argument
`outcomes`|`OutcomeSuggestion[]`|an array of outcome suggestion documents
`filter`|`{[prop:string]:string}`|object with string values to filter on
`err`|`string`|an error message, or null if everything worked

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
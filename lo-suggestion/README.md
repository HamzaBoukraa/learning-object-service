# Learning Outcome Suggestion Service

Suggest CLARK learning outcomes which relate to a text argument you provide.

## POST request API

### `/suggestOutcomes`
| Request                           | []()                                   | []() |
| --------------------------------- | -------------------------------------- | ---- |
| `text`|`string`                   | the text argument                      |
| `filter`|`{[prop:string]:string}` | object with string values to filter on |

| Response         | []()                             | []()                                     |
| ---------------- | -------------------------------- | ---------------------------------------- |
| []()             | `OutcomeSuggestion[]`            | an array of outcome suggestion documents |
| `error`|`string` | exists only if an error occurred |

#### Filter Behavior
Say `filter` looks like this:
```javascript
filter = {
    author: "NCWF",
    name: "0001",
    ignoreme: "foo",
}
```
`outcomes` will only contain outcomes whose `author` field contains the text "NCWF" and whose `name` field contains the text "0001". The outcomes need only _contain_ the text; it need not be an exact match. Thus, `outcomes` may contain documents with `author` "NCWF" _or_ "NCWF Tasks", as long as its `name` has "0001" in it. The `ignoreme` field does not exist in an outcome suggestion document, so it is ignored.

### `/suggestObjects`
| Request            | []()                                                                                                                                        | []() |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `name`|`string`    | if not empty, suggested objects' `name`s exactly match `name`                                                                               |
| `author`|`string`  | if not empty, suggested objects' authors' `name`s exactly match `author`                                                                    |
| `length`|`string`  | if not empty, suggested objects' `length`s exactly match `length`                                                                           |
| `level`|`string`   | not presently used                                                                                                                          |
| `content`|`string` | if not empty, suggested objects must contain at least one outcome containing each word (technically each word is parsed as a regex pattern) |

| Response         | []()                             | []()                                    |
| ---------------- | -------------------------------- | --------------------------------------- |
| []()             | `ObjectSuggestion[]`             | an array of object suggestion documents |
| `error`|`string` | exists only if an error occurred |

NOTE: This event's interface should be correct, but it's behavior is likely to change.

### `/fetchAllObjects`
Request - no parameters

|     | Response         | []()                             | []()                                     |     |
| --- | ---------------- | -------------------------------- | ---------------------------------------- | --- |
|     | []()             | `LearningObject[]*`              | an array of outcome suggestion documents |     |
|     | `error`|`string` | exists only if an error occurred |                                          |

`*` The array consists of serialized `LearningObject`s. Unserialize with the `map` function:
```javascript
let objects: LearningObject[] = response.body.map((a:string)=>{return LearningObject.unserialize(a,null)});
```

### `/fetchMultipleObjects`
| Request          | []()                            | []() |
| ---------------- | ------------------------------- | ---- |
| `ids`|`string[]` | the array of LearningObject IDs |

| Response         | []()                             | []()                                     |
| ---------------- | -------------------------------- | ---------------------------------------- |
| []()             | `LearningObject[]*`              | an array of outcome suggestion documents |
| `error`|`string` | exists only if an error occurred |

`*` The array consists of serialized `LearningObject`s. Unserialize with the `map` function:
```javascript
let objects: LearningObject[] = response.body.map((a:string)=>{return LearningObject.unserialize(a,null)});
```
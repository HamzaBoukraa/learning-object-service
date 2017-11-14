# Database Interaction Service

Provide an interaction layer for core CLARK database functions.

## POST request API

The service listens for POST requests at `/<event name>`. The request body should be a JSON-parsable object containing each parameter as a property. The response body is the return value, unless it has an error property in which case it's an error.

When a parameter is a CLARK entity, it must first be serialized; return values must be similarly deserialized. Use the static methods provided in each entity class.

See below for each event name, parameter descriptions, and return values (if any).

#### authenticate
Name | Type | Description
---|---|---
`userid`|`string`|user's login id
`pwd`|`string`|user's password
||
`authorized`|`boolean`|true iff user and pwd match

#### findUser
Name | Type | Description
---|---|---
`userid`|`string`|user's login id
||
`id`||user's unique database id

#### findLearningObject
Name | Type | Description
---|---|---
`author`||object author's unique database id
`name`|`string`|learning object's name
||
`id`||learning object's unique database id

#### loadUser
Name | Type | Description
---|---|---
`id`||user's unique database id
||
`user`|`User`|user entity, without any objects

#### loadLearningObjectSummary
Name | Type | Description
---|---|---
`id`||user's unique database id
||
`objects`|`LearningObject[]`|array of learning object entities, without goals or outcomes

NOTE: This event's return value is a JSON string representing an array of serialized LearningObjects. You'll need to parse the array before unserializing its elements.

#### loadLearningObject
Name | Type | Description
---|---|---
`id`||object's unique database id
||
`object`|`LearningObject`|learning object entity, completely loaded

#### addUser
Name | Type | Description
---|---|---
`user`|`User`|user entity (objects property is ignored)
||
`id`||new user's unique database id

#### addLearningObject
Name | Type | Description
---|---|---
`author`||object author's unique database id
`object`|`string`|learning object entity (outcomes property is ignored)
||
`id`||new object's unique database id

NOTE: This is the last event listed here with a return value.

#### editUser
Name | Type | Description
---|---|---
`id`||user's unique database id
`user`|`User`|new user entity (objects property is ignored)

#### updateLearningObject
Name | Type | Description
---|---|---
`id`||object's unique database id
`object`|`LearningObject`|new learning object entity (outcomes property is ignored)

#### reorderObject
Name | Type | Description
---|---|---
`user`||user's unique database id
`object`||object's unique database id
`index`|`number`|new index for `object` in `user`'s `objects`

#### mapOutcome
Name | Type | Description
---|---|---
`outcome`||outcome's unique database id
`mapping`||unique database id of outcome to map to

#### unmapOutcome
Name | Type | Description
---|---|---
`outcome`||outcome's unique database id
`mapping`||unique database id of outcome to unmap

#### deleteUser
Name | Type | Description
---|---|---
`id`||user's unique database id

#### deleteLearningObject
Name | Type | Description
---|---|---
`id`||object's unique database id
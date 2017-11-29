# Database Interaction Service

Provide an interaction layer for core CLARK database functions.

The service listens for POST requests at `/<request-name>`.
* The request body should be a JSON object containing each required parameter as a property.
* The response body is the JSON-serialized return value, unless it has an error property, which is a string describing what went wrong.

`*` All *entities* (`User`, `LearningObject`, `LearningOutcome`, etc.) must be serialized for network communication. Entities in a response must be unserialized.
```typescript
request.body.user = User.serialize(user);           // request example
let user: User = User.unserialize(response.body);   // response example
```

## POST request API

### `/authenticate`
Request | []() | []()
---|---|---
`userid`|`string`|user's login id
`pwd`|`string`|user's password

Response| []() | []()
---|---|---
[]()|`boolean`|true iff user and pwd match
`error`|`string`|exists only if an error occurred

#### Errors
- If `userid` is invalid. This allows distinction between a wrong `userid` and a wrong `pwd` by whether or not `body.error` exists.

### `/findUser`
Request | []() | []()
---|---|---
`userid`|`string`|user's login id

Response| []() | []()
---|---|---
[]()||user's unique database id
`error`|`string`|exists only if an error occurred

#### Errors
- If `userid` is invalid.

### `/findLearningObject`
Request | []() | []()
---|---|---
`author`||object author's unique database id
`name`|`string`|learning object's name

Response| []() | []()
---|---|---
[]()||learning object's unique database id
`error`|`string`|exists only if an error occurred

#### Errors
- If the `author`-`name` pair is invalid.

### `/loadUser`
Request | []() | []()
---|---|---
`id`||user's unique database id

Response| []() | []()
---|---|---
[]()|`User*`|user entity, without any objects
`error`|`string`|exists only if an error occurred

#### Errors
- If `id` is not a user database id. Perhaps it was deleted by another request?

### `/loadLearningObjectSummary`
Request | []() | []()
---|---|---
`id`||user's unique database id

Response| []() | []()
---|---|---
[]()|`LearningObject[]*`|array of learning object entities, without goals or outcomes
`error`|`string`|exists only if an error occurred

#### Errors
- If `id` is not a user database id. Perhaps it was deleted by another request?

`*` The array consists of serialized `LearningObject`s. Unserialize with the `map` function:
```javascript
let objects: LearningObject[] = response.body.map((a:string)=>{return LearningObject.unserialize(a,null)});
```

### `/loadLearningObject`
Request | []() | []()
---|---|---
`id`||object's unique database id

Response| []() | []()
---|---|---
[]()|`LearningObject*`|learning object entity, completely loaded
`error`|`string`|exists only if an error occurred

#### Errors
- If `id` is not an object database id. Perhaps it was deleted by another request?

### `/addUser`
Request | []() | []()
---|---|---
`user`|`User*`|user entity (objects property is ignored)

Response| []() | []()
---|---|---
[]()||new user's unique database id
`error`|`string`|exists only if an error occurred

#### Errors
- If a user with the same `userid` already exists.

### `/addLearningObject`
Request | []() | []()
---|---|---
`author`||object author's unique database id
`object`|`string`|learning object entity (outcomes property is ignored)

Response| []() | []()
---|---|---
[]()||new object's unique database id
`error`|`string`|exists only if an error occurred

#### Errors
- If `author` is not a user database id. Perhaps it was deleted by another request?
- If `author` already has a learning object with the same `name`.

### `/editUser`
Request | []() | []()
---|---|---
`id`||user's unique database id
`user`|`User*`|new user entity (objects property is ignored)

Response| []() | []()
---|---|---
`error`|`string`|exists only if an error occurred

#### Errors
- If `author` is not a user database id. Perhaps it was deleted by another request?
- If a user with the same `userid` already exists.

### `/updateLearningObject`
Request | []() | []()
---|---|---
`id`||object's unique database id
`object`|`LearningObject*`|new learning object entity (its outcomes' mappings are ignored)

Response| []() | []()
---|---|---
`error`|`string`|exists only if an error occurred

#### Errors
- If `id` is not an object database id. Perhaps it was deleted by another request?
- If the object's `author` already has a learning object with the new `name`.
- If any outcomes have the same `tag`.

### `/reorderObject`
Request | []() | []()
---|---|---
`user`||user's unique database id
`object`||object's unique database id
`index`|`number`|new index for `object` in `user`'s `objects`

Response| []() | []()
---|---|---
`error`|`string`|exists only if an error occurred

#### Errors
- TODO: I'm not certain of error behavior here. Must be tested thoroughly. It SHOULD error if `user` doesn't exist, `object` isn't in that user's objects list, or if `index` is negative or exceeds that user's number of objects.

### `/mapOutcome`
Request | []() | []()
---|---|---
`outcome`||outcome's unique database id
`mapping`||unique database id of outcome to map to

Response| []() | []()
---|---|---
`error`|`string`|exists only if an error occurred

#### Errors
- TODO: I'm not certain of error behavior here. Must be tested thoroughly. It SHOULD error if either `outcome` or `mapping` aren't outcome database ids.

### `/unmapOutcome`
Request | []() | []()
---|---|---
`outcome`||outcome's unique database id
`mapping`||unique database id of outcome to unmap

Response| []() | []()
---|---|---
`error`|`string`|exists only if an error occurred

#### Errors
- TODO: I'm not certain of error behavior here. Must be tested thoroughly. It SHOULD error if `outcome` isn't an outcome database id, or if `mapping` isn't one of that outcome's mappings.

### `/deleteUser`
Request | []() | []()
---|---|---
`id`||user's unique database id

Response| []() | []()
---|---|---
`error`|`string`|exists only if an error occurred

#### Errors
- If `id` is not a user database id. But your post-condition remains.

### `/deleteLearningObject`
Request | []() | []()
---|---|---
`id`||object's unique database id

Response| []() | []()
---|---|---
`error`|`string`|exists only if an error occurred

#### Errors
- If `id` is not an object database id. But your post-condition remains.

### `/fetchAllObjects`
Request | []() | []()
---|---|---

Response| []() | []()
---|---|---
[]()|`LearningObject[]*`|array of learning object entities, without goals or outcomes
`error`|`string`|exists only if an error occurred

`*` The array consists of serialized `LearningObject`s. Unserialize with the `map` function:
```typescript
let objects: LearningObject[] = response.body.map((a:string)=>{return LearningObject.unserialize(a,null)});
```

## Error Guide
Errors originating in the database-interaction service should be self-explanatory, but some originating in the database itself or its node driver are less so. Add to this list as needed.

* `MongoError: connection lost`

    The db-interaction service's connection to the database was lost. This is either a network error, or the database process you are using has been terminated.

* `MongoError: topology was destroyed`
  
    Somehow the db-interaction service's connection to the database was explicitly closed, with outstanding requests.
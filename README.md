# Database Interaction
Code for all CLARK scripts and services needing direct contact with the database. Each service has usage instructions in its own README file.
# Database Interaction Service

Provide an interaction layer for core CLARK database functions.

The service listens for requests at `/api/<request-name>`.

`*` All *entities* (`User`, `LearningObject`, `LearningOutcome`, etc.) must be serialized for network communication. Entities in a response must be unserialized.
```typescript
request.body.user = User.serialize(user);           // request example
let user: User = User.unserialize(response.body);   // response example
```

## User Routes
### `/authenticate`

| Request Type | Request Body |Type| Description |
| --- | --- | --- | --- |
| POST | `username`  |`string`  | user's username |
|  | `pwd`  |`string`  | user's password |

| Response Body        | Type                             | Description                       |
| ---------------- | -------------------------------- | --------------------------- |
| []()             | `User`                        | Serialized User entity if user authenticated |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If `username` or `pwd` is invalid.

### `/register`

| Request Type | Request Body |Type| Description |
| --- | --- | --- | --- |
| POST | `user`  |`User`  | Serialized User entity |

| Response Body        | Type                             | Description                        |
| ---------------- | -------------------------------- | --------------------------- |
| []()             | `User`                        | Serialized User entity if user was registered successfully |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If `user.username` or `user.email` is already in use.

### `/emailRegistered`

| Request  Type        | Request Body|  Type         | Description |
| ---------------- | -------------- | ---| ---- |
| POST|`email` | `string` | email to check

| Response Body       | Type                            | Description                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| []()             | `boolean`                        | true iff email is registered to a user |
| `error`|`string` | exists only if an error occurred |

#### Errors
- NONE

### `/findUser/:username`
Request Type | Request Params | Type | Description
---|---|---| ---|
GET|`username`|`string`|user's username|

| Response         | Type                             | Description                     |
| ---------------- | -------------------------------- | ------------------------- |
| []()             |  `string`                                | user's unique database `id` |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If `username` is invalid.

### `/loadUser/:id`
Request Type | Request Params | Type | Description
---|---|---| ---|
GET|`id`|`string`|user's unique databse `id`|

| Response         | Type                             | Description                     |
| ---------------- | -------------------------------- | ------------------------- |
| []()             |  `User`                                | Serialized User entity |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If `id` is invalid.

### `/editUser`

| Request  Type        | Request Body|  Type         | Description |
| ---------------- | -------------- | ---| ---- |
| PATCH|`id` | `string` | user's unique database id
| |`user` | `User` | Serialized User entity

| Response Body       | Type                            | Description                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| []()             | `success`                        | Sends status code `200` with no body if `user` was successfully edited  |
| `error`|`string` | exists only if an error occurred |

#### Errors
If `id` is invalid.

### `/deleteUser/:id`
Request Type | Request Params | Type | Description
---|---|---| ---|
DELETE|`id`|`string`|user's unique databse `id`|

| Response         | Type                             | Description                     |
| ---------------- | -------------------------------- | ------------------------- |
| []()             |  `success`                                | Sends status code `200` with no body if `user` was successfully deleted |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If `id` is invalid.

## Learning Object Routes

### `/addLearningObject`

| Request  Type        | Request Body|  Type         | Description |
| ---------------- | -------------- | ---| ---- |
| POST|`author` | `string` | user's username
| |`object` | `LearningObject` | Serialized LearningObject entity

| Response Body       | Type                            | Description                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| []()             | `string`                        | LearningObject's unique database `id`  |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If `object.name` is already in use.

### `/fetchAllObjects`
Request Type | Request Params | Type | Description
---|---|---|---
GET| | | 

| Response         | Type                             | Description                                                        |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| []()             | `{objects: LearningObject[]*, total: number}`              | Object containing Array of Serialized LearningObject entities, without goals or outcomes & total number of LearningObjects  |
| `error`|`string` | exists only if an error occurred |

#### Errors
- NONE

### `/fetchMultipleObjects/:ids`
Request Type | Request Params | Type | Description
---|---|---|---
GET|`ids` |`{username: string, learningObjectName: string}[]` | Array of objects containing `username`-`learningObjectName` pairs

| Response         | Type                             | Description                                                        |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| []()             | `LearningObject[]*`              | Array of Serialized LearningObject entities, without goals or outcomes |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If the `author`-`learningObjectName` pair is invalid.

### `/fetchObjectsSummary/:ids`
Request Type | Request Params | Type | Description
---|---|---|---
GET|`ids` |`string[]` | Array of LearningObjects' unique database `ids`

| Response         | Type                             | Description                                                        |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| []()             | `LearningObject[]*`              | Array of Serialized LearningObject entities, without goals or outcomes |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If the `id` is invalid.

### `/fetchFullObjects/:ids`
Request Type | Request Params | Type | Description
---|---|---|---
GET|`ids` |`string[]` | Array of LearningObjects' unique database `ids`

| Response         | Type                             | Description                                                        |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| []()             | `LearningObject[]*`              | Array of Serialized LearningObject entities, with goals and outcomes |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If the `id` is invalid.

### `/findLearningObject/:author/:learningObjectName`

Request Type | Request Params | Type | Description
---|---|---| ---|
GET|`author`|`string`|user's username|
||`learningObjectName` | `string`|LearningObjects's literal name|

| Response         | Type                             | Description                     |
| ---------------- | -------------------------------- | ------------------------- |
| []()             |  `string`                                | LearningObject's unique database id |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If the `author`-`learningObjectName` pair is invalid.

### `/loadLearningObjectSummary/:username`
Request Type | Request Params | Type | Description
---|---|---|---
GET|`username`|`string`| user's username

| Response         | Type                             | Description                                                        |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| []()             | `LearningObject[]*`              | array of Serialized LearningObject entities, without goals or outcomes |
| `error`|`string` | exists only if an error occurred |

#### Errors
- If `username` is not a user database username. Perhaps it was deleted by another request?

`*` The array consists of serialized `LearningObject`s. Unserialize with the `map` function:
```javascript
let objects: LearningObject[] = response.body.map((a:string)=>{return LearningObject.unserialize(a,null)});
```

### `/loadLearningObject/:username/:learningObjectName`

Request Type | Request Params | Type | Description
---|---|---|---
GET|`username`|`string`| user's username
||`learningObjectName`|`string`| LearningObject's literal name

| Response         | Type                             | Description                                                        |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| []()             | `LearningObject`              | Serialized LearningObject entity, with goals and outcomes |
| `error`|`string` | exists only if an error occurred |

#### Errors
-  If the `author`-`learningObjectName` pair is invalid.

### `/suggestObjects`

| Request  Type        | Request Query Params|  Type         | Description |
| ---------------- | -------------- | ---| ---- |
| GET|`name` | `string` | `LearningObject`'s name property being queried for
| |`author` | `string` | `LearningObject`'s `author`'s `username` property being queried for
| |`length` | `string` | `LearningObject`'s `length` property being queried for
| |`level` | `string` | `LearningObject`'s `level` property being queried for
| |`source` | `string` | `LearningObject`'s `Outcomes`' `mapping` `source` property being queried for
| |`text` | `string` | Broad text match search over all searchable `LearningObject` properties. To be used independently of other Query Params pertaining to `LearningObject` properties.
| |`currPage` | `number` | If using pagination, the current page the client is displaying
| |`limit` | `number` | Maximum amount of Learning Objects to return

| Response Body       | Type                            | Description                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| []()             | `{objects: LearningObject[]*, total: number}`                      | Object containing Array of Serialized LearningObject entities, without goals or outcomes & total number of LearningObjects |
| `error`|`string` | exists only if an error occurred |

#### Errors
If `id` is invalid.

### `/updateLearningObject`

| Request  Type        | Request Body|  Type         | Description |
| ---------------- | -------------- | ---| ---- |
| PATCH|`id` | `string` | object's unique database `id`
| |`object` | `LearningObject` | Serialized LearningObject entity

| Response Body       | Type                            | Description                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| []()             | `success`                        | Sends status code `200` with no body if `user` was successfully edited  |
| `error`|`string` | exists only if an error occurred |

#### Errors
If `id` is invalid.

### `/reorderOutcome`

| Request  Type        | Request Body|  Type         | Description |
| ---------------- | -------------- | ---| ---- |
| POST|`outcome` | `LearningOutcome` | `LearningObject`'s `LearningOutcome` 
| |`object` | `LearningObject` | Serialized LearningObject entity
| |`index` | `number` | `LearningOutcome`'s `index` in `LearningObject`'s outcomes Array

| Response Body       | Type                            | Description                                   |
| ---------------- | -------------------------------- | -------------------------------------- |
| []()             | `success`                        | Sends status code `200` with no body if `user` was successfully edited  |
| `error`|`string` | exists only if an error occurred |

#### Errors
- ???

### `/deleteLearningObject/:username/:learningObjectName`
Request Type | Request Params | Type | Description
---|---|---| ---|
DELETE|`username`|`string`|user's username|
||`learningObjectName`|`string`|LearningObjects's literal name|

| Response         | Type                             | Description                     |
| ---------------- | -------------------------------- | ------------------------- |
| []()             |  `success`                                | Sends status code `200` with no body if `LearningObject` was successfully deleted |
| `error`|`string` | exists only if an error occurred |

#### Errors
-  If the `username`-`learningObjectName` pair is invalid.

### `/deleteMultipleLearningObjects/:username/:learningObjectNames`
Request Type | Request Params | Type | Description
---|---|---| ---|
DELETE|`username`|`string`|user's username|
||`learningObjectNames`|`string[]`|Array of LearningObjects' literal name|

| Response         | Type                             | Description                     |
| ---------------- | -------------------------------- | ------------------------- |
| []()             |  `success`                                | Sends status code `200` with no body if `LearningOjects` were successfully deleted |
| `error`|`string` | exists only if an error occurred |

#### Errors
-  If the `username`-`learningObjectName` pair is invalid.


## Error Guide
Errors originating in the database-interaction service should be self-explanatory, but some originating in the database itself or its node driver are less so. Add to this list as needed.

* `MongoError: connection lost`

    The db-interaction service's connection to the database was lost. This is either a network error, or the database process you are using has been terminated.

* `MongoError: topology was destroyed`
  
    Somehow the db-interaction service's connection to the database was explicitly closed, with outstanding requests.
    
    
 ## FIXMEs

Private routes containing username as a parameter need to be updated to not get username from the route parameter, but from the user's token for validation of `LearningObject` modification.
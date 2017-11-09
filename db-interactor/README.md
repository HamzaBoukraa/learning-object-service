# Database Interaction Service

Provide an interaction layer for core CLARK database functions.

## Connection

```javascript
var uri = "http://"+process.env["CLARK_DB_INTERACTOR_IP"]+":"+process.env["CLARK_DB_INTERACTOR_PORT"];
var client = require('socket.io-client')(uri);
```

## Event API

#### authenticate
`client.emit('authenticate', userid, pwd, (authorized)=>{...});`
Name | Type | Description
---|---|---
`userid`|`string`|user's login id
`pwd`|`string`|user's password
`authorized`|`boolean`|true iff user and pwd match

#### findUser
`client.emit('findUser', userid, (id)=>{...});`
Name | Type | Description
---|---|---
`userid`|`string`|user's login id
`id`||user's unique database id

#### findLearningObject
`client.emit('findLearningObject', author, name, (id)=>{...});`
Name | Type | Description
---|---|---
`author`||object author's unique database id
`name`|`string`|learning object's name
`id`||learning object's unique database id

#### loadUser
`client.emit('loadUser', id, (user)=>{...});`
Name | Type | Description
---|---|---
`id`||user's unique database id
`user`|`User`|user entity, without any objects

#### loadLearningObjectSummary
`client.emit('loadLearningObjectSummary', id, (objects)=>{...});`
Name | Type | Description
---|---|---
`id`||user's unique database id
`objects`|`LearningObject[]`|array of learning object entities, without goals or outcomes

#### loadLearningObject
`client.emit('loadLearningObject', id, (object)=>{...});`
Name | Type | Description
---|---|---
`id`||object's unique database id
`object`|`LearningObject`|learning object entity, completely loaded

#### addUser
`client.emit('addUser', user, (id)=>{...});`
Name | Type | Description
---|---|---
`user`|`User`|user entity (objects property is ignored)
`id`||new user's unique database id

#### addLearningObject
`client.emit('addLearningObject', author, object, (id)=>{...});`
Name | Type | Description
---|---|---
`author`||object author's unique database id
`object`|`string`|learning object entity (outcomes property is ignored)
`id`||new object's unique database id

#### addLearningOutcome
`client.emit('addLearningOutcome', source, outcome, (id)=>{...});`
Name | Type | Description
---|---|---
`source`||outcome object's unique database id
`outcome`|`string`|learning outcome entity
`id`||new outcome's unique database id

#### editUser
`client.emit('editUser', id, user, ()=>{...});`
Name | Type | Description
---|---|---
`id`||user's unique database id
`user`|`User`|new user entity (objects property is ignored)

#### editLearningObject
`client.emit('editLearningObject', id, object, ()=>{...});`
Name | Type | Description
---|---|---
`id`||object's unique database id
`object`|`LearningObject`|new learning object entity (outcomes property is ignored)

#### editLearningOutcome
`client.emit('editLearningOutcome', id, outcome, ()=>{...});`
Name | Type | Description
---|---|---
`id`||object's unique database id
`outcome`|`LearningOutcome`|new learning outcome entity

#### reorderObject
`client.emit('reorderObject', user, object, index, ()=>{...});`
Name | Type | Description
---|---|---
`user`||user's unique database id
`object`||object's unique database id
`index`|`number`|new index for `object` in `user`'s `objects`

#### reorderOutcome
`client.emit('reorderOutcome', object, outcome, index, ()=>{...});`
Name | Type | Description
---|---|---
`object`||object's unique database id
`outcome`||outcome's unique database id
`index`|`number`|new index for `outcome` in `object`'s `outcomes`

#### mapOutcome
`client.emit('mapOutcome', outcome, mapping, ()=>{...});`
Name | Type | Description
---|---|---
`outcome`||outcome's unique database id
`mapping`||unique database id of outcome to map to

#### unmapOutcome
`client.emit('unmapOutcome', outcome, mapping, ()=>{...});`
Name | Type | Description
---|---|---
`outcome`||outcome's unique database id
`mapping`||unique database id of outcome to unmap

#### deleteUser
`client.emit('deleteUser', id, ()=>{...});`
Name | Type | Description
---|---|---
`id`||user's unique database id

#### deleteLearningObject
`client.emit('deleteLearningObject', id, ()=>{...});`
Name | Type | Description
---|---|---
`id`||object's unique database id

#### deleteLearningOutcome
`client.emit('deleteLearningOutcome', id, ()=>{...});`
Name | Type | Description
---|---|---
`id`||outcome's unique database id
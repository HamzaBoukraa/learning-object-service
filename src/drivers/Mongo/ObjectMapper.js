"use strict";
exports.__esModule = true;
var clark_entity_1 = require("@cyber4all/clark-entity");
/**
 * Generates User object from Document
 *
 * @private
 * @param {UserDocument} userRecord
 * @returns {User}
 * @memberof MongoDriver
 */
function generateUser(userRecord) {
    var user = new clark_entity_1.User(userRecord.username, userRecord.name, userRecord.email, userRecord.organization, null);
    user.emailVerified = userRecord.emailVerified
        ? userRecord.emailVerified
        : false;
    return user;
}
exports.generateUser = generateUser;

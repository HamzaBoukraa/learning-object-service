"use strict";
exports.__esModule = true;
exports.LEARNING_OBJECT_ROUTES = {
    GET_FILE: function (params) {
        return (process.env.NODE_ENV === 'production'
            ? process.env.LEARNING_OBJECT_API
            : process.env.LEARNING_OBJECT_API_DEV) + "/users/" + params.username + "/learning-objects/" + params.objectId + "/files/" + params.fileId + "/download";
    },
    CLARK_DETAILS: function (params) {
        return process.env.CLARK_URL + "/details/" + params.username + "/" + encodeURIComponent(params.objectName);
    }
};
exports.LIBRARY_ROUTES = {
    METRICS: function (objectID) {
        return process.env.CART_API + "/learning-objects/" + objectID + "/metrics";
    },
    CLEAN: function (objectIDs) {
        return process.env.CART_API + "/libraries/learning-objects/" + objectIDs.join(',') + "/clean";
    }
};

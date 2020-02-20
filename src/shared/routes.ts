export const LEARNING_OBJECT_ROUTES = {
  GET_FILE(params: { objectId: string; fileId: string; username: string }) {
    return `${
      process.env.NODE_ENV === 'production'
        ? process.env.LEARNING_OBJECT_API
        : process.env.LEARNING_OBJECT_API_DEV
    }/users/${params.username}/learning-objects/${params.objectId}/files/${
      params.fileId
    }/download`;
  },
  CLARK_DETAILS(params: { objectName: string; username: string }) {
    return `${process.env.CLARK_URL}/details/${
      params.username
    }/${encodeURIComponent(params.objectName)}`;
  },
};

export const LIBRARY_ROUTES = {
  METRICS(objectID: string) {
    return `${process.env.CART_API}/learning-objects/${objectID}/metrics`;
  },
  CLEAN(objectIDs: string[]) {
    return `${process.env.CART_API}/libraries/learning-objects/${objectIDs.join(
      ',',
    )}/clean`;
  },
  UPDATE_OBJECTS(cuid: string) {
    return `${process.env.CART_API}/libraries?cuid=${encodeURIComponent(cuid)}`;
  },
};

export const UTILITY_SERVICE = {
  USERS() {
    return `${process.env.UTILITY_URI}/utility-users`;
  },
};

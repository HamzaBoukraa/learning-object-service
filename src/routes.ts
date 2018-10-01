
export const LEARNING_OBJECT_ROUTES = {
  GET_FILE(id: string, filename: string) {
    return `${
      process.env.LEARNING_OBJECT_API
    }/learning-objects/${id}/files/${encodeURIComponent(filename)}`;
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
};

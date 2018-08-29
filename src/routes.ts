import * as dotenv from 'dotenv';
dotenv.config();

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

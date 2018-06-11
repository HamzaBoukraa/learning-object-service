import * as dotenv from 'dotenv';
dotenv.config();

export const CART_ROUTES = {
  METRICS(objectID: string) {
    return `${process.env.CART_API}/learning-objects/${objectID}/metrics`;
  },
};

export const CART_ROUTES = {
  METRICS(objectID: string) {
    return `${process.env.CART_API}/learning-objects/${objectID}/metrics`;
  },
};

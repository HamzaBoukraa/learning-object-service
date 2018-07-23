export interface ServiceMessager {
  sendMessage(service: SERVICE, message: ServiceMessage): void;
}

export enum SERVICE {
  USER_SERVICE,
  CART_SERVICE,
}
export enum SYSTEM_EVENT {
  AUTHOR_UPDATED_LEARNING_OBJECT,
}
export interface ServiceMessage {
  event: SYSTEM_EVENT;
  payload: any;
}

import { ServiceMessager, SERVICE, ServiceMessage, SYSTEM_EVENT } from '../interfaces/ServiceMessager';
import axios from 'axios';
import { generateServiceToken } from './TokenManager';

export class HTTPServiceMessager implements ServiceMessager {

  /**
   * Forwards a message to a micro-service handler for transmission.
   * Does not recieve data in return.
   *
   * @param service the micro-service that the message is being sent to
   * @param message the message to send
   */
  sendMessage(service: SERVICE, message: ServiceMessage) {
    switch (service) {
      case SERVICE.CART_SERVICE:
        this.sendCartServiceMessage(message);
        break;
      case SERVICE.USER_SERVICE:
        this.sendUserServiceMessage(message);
        break;
      default:
        throw new Error(`${service} does not have a handler defined!`);
    }
  }

  private sendCartServiceMessage(message: ServiceMessage): any {
    throw new Error('Method not implemented.');
  }
  private sendUserServiceMessage(message: ServiceMessage): any {
    switch (message.event) {
      case SYSTEM_EVENT.AUTHOR_UPDATED_LEARNING_OBJECT:
        this.triggerUpdateMessage(message.payload);
        break;
      default:
        throw new Error(`${message.event} does not have a valid case defined!`);
    }
  }

  private triggerUpdateMessage(payload: any) {
    axios.post(`${process.env.USER_SERVICE_URI}/learning-objects/${payload.username}/${payload.learningObjectName}/subscribers/messages`, {
      id: payload.id,
    },         {
      headers: {
        Authorization: `Bearer ${generateServiceToken()}`,
      },
    });
  }
}

const USER_ROUTES = {
  LIST_USERS_WITH_OBJECT_IN_LIBRARY(id: string) {
    return `/users/cart/learning-objects/${id}`;
  },
};

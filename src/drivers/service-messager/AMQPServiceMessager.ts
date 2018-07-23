import { ServiceMessager, SERVICE, ServiceMessage, SYSTEM_EVENT } from './ServiceMessager';
import * as amqp from 'amqplib';

export class AMQPServiceMessager implements ServiceMessager {

  /**
   * Forwards a message to a micro-service handler for transmission.
   * Does not recieve data in return.
   *
   * @param service the micro-service that the message is being sent to
   * @param message the message to send
   */
  sendMessage(service: SERVICE, message: ServiceMessage) {
    switch (message.event) {
      case SYSTEM_EVENT.AUTHOR_UPDATED_LEARNING_OBJECT:
        this.triggerUpdateMessage(message);
        break;
      default:
        throw new Error(`${message.event} does not have a valid case defined!`);
    }
  }


  private triggerUpdateMessage(message: any) {
    amqp.connect('amqp://localhost:5672', function (err: any, conn: any) {
      if (err) throw err;
      conn.createChannel(function (channelError: any, ch: any) {
        if (channelError) throw channelError;
        const q = 'hello';

        ch.assertQueue(q, { durable: false });
        // Note: on Node 6 Buffer.from(msg) should be used
        ch.sendToQueue(q, new Buffer(JSON.stringify(message)));

        ch.close();
        conn.close();
      });
    });
  }
}

const USER_ROUTES = {
  LIST_USERS_WITH_OBJECT_IN_LIBRARY(id: string) {
    return `/users/cart/learning-objects/${id}`;
  },
};

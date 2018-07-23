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
    console.log(message.event);
    switch (message.event) {
      case SYSTEM_EVENT.AUTHOR_UPDATED_LEARNING_OBJECT:
        this.triggerUpdateMessage(message);
        break;
      default:
        throw new Error(`${message.event} does not have a valid case defined!`);
    }
  }


  private triggerUpdateMessage(message: any) {
    console.log('trigger update');
    /* amqp.connect('amqp://rabbitmq:5672', function (err: any, conn: any) {
      if (err) throw err;
      conn.createConfirmChannel(function (channelError: any, ch: any) {
        if (channelError) throw channelError;
        const q = 'hello';

        ch.publish('', q, new Buffer(JSON.stringify(message)), { deliveryMode: 2 }, () => {
          console.log('ack');
          conn.close();
        });
      });
    }); */
    try {
      amqp.connect('amqp://rabbitmq:5672').then((conn: any) => {
        conn.createConfirmChannel().then((ch: any, err: any) => {
          if (err) throw err;
          const q = 'hello';

          ch.publish('', q, new Buffer(JSON.stringify(message)), { deliveryMode: 2 }, () => {
            console.log('ack');
            conn.close();
          });
        });
      });
    } catch (e) {
      console.error(e);
    }
  }
}

const USER_ROUTES = {
  LIST_USERS_WITH_OBJECT_IN_LIBRARY(id: string) {
    return `/users/cart/learning-objects/${id}`;
  },
};

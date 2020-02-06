import { ServiceEvent } from '../../shared/types';
import { MessageQueue } from '../interfaces/messageQueue';
import { RabbitMQConnection } from '../../drivers/RabbitMQ/rabbitMQConnection';
import { Channel } from 'amqplib';

const AMQP_EXCHANGE_NAME = process.env.AMQP_EXCHANGE_NAME;
const AMQP_REVISION_RELEASE_ROUTING_KEY = process.env.AMQP_REVISION_RELEASE_ROUTING_KEY;

export class RabbitMQ implements MessageQueue {
    private rabbitMQChannel: Channel;

    constructor() {
        this.rabbitMQChannel = RabbitMQConnection.getChannel();
    }

    async sendMessage(serviceEvent: ServiceEvent): Promise<boolean> {
       const payload = JSON.stringify(serviceEvent);
       await this.rabbitMQChannel.checkExchange(AMQP_EXCHANGE_NAME);
       const isSuccessful = this.rabbitMQChannel.publish(AMQP_EXCHANGE_NAME, AMQP_REVISION_RELEASE_ROUTING_KEY, Buffer.from(payload));
       return isSuccessful;
    }

}

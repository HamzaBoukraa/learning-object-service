import { ServiceEvent } from '../../shared/types';
import { MessageQueue } from './messageQueue';
import { connect, Connection, Channel } from 'amqplib';
const AMQP_URL = process.env.AMQP_URL;
const AMQP_EXCHANGE_NAME = process.env.AMQP_EXCHANGE_NAME;
const AMQP_REVISION_RELEASE_ROUTING_KEY = process.env.AMQP_REVISION_RELEASE_ROUTING_KEY;

export class RabbitMQ implements MessageQueue {
    static instance: RabbitMQ;
    private connection: Connection;
    private channel: Channel;

    static async buildMessageQueue() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new RabbitMQ();
        this.instance.connection = await connect(AMQP_URL);
        this.instance.channel = await this.instance.connection.createChannel();
        return this.instance;
    }



    async sendMessage(serviceEvent: ServiceEvent): Promise<boolean> {
       const payload = JSON.stringify(serviceEvent);
       const checkExchange = await this.channel.checkExchange(AMQP_EXCHANGE_NAME);
       const isSuccessful = this.channel.publish(AMQP_EXCHANGE_NAME, AMQP_REVISION_RELEASE_ROUTING_KEY, Buffer.from(payload));
       return isSuccessful;

    }

}

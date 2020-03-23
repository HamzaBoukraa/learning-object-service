import { connect, Connection, Channel } from 'amqplib';
const AMQP_URL = process.env.AMQP_URL;

export class RabbitMQConnection {
    static instance: RabbitMQConnection;
    private connection: Connection;
    private channel: Channel;

    static async buildMessageQueue() {
        if (this.instance) {
            throw new Error('A connection to RabbitMQ already exists');
        }
        this.instance = new RabbitMQConnection();
        this.instance.connection = await connect(AMQP_URL);
        this.instance.channel = await this.instance.connection.createChannel();
    }

    static getChannel() {
        if (this.instance) {
            return this.instance.channel;
        }
        throw new Error('Connection to RabbitMQ does not exist');
    }
}

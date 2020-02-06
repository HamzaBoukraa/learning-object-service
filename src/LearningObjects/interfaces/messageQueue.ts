import { ServiceEvent } from '../../shared/types';

// interface for handling message queue
export abstract class MessageQueue {
    abstract sendMessage(serviceEvent: ServiceEvent): Promise<boolean>;
}

import { ServiceEvent } from '../../shared/types';

// interface for handling message queue
export interface MessageQueue {
    sendMessage(serviceEvent: ServiceEvent): Promise<boolean>;
}

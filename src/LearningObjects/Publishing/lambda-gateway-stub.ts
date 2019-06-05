import { mapResponseDataToError, ServiceError, ServiceErrorReason } from '../../shared/errors';
import * as https from 'https';
import { generateServiceToken } from '../../drivers/TokenManager';
import { ReleaseEmailGateway } from './release-email-gateway';

export class LambdaGatewayStub implements ReleaseEmailGateway {

    invokeReleaseNotification(params: {
        learningObjectName: string,
        authorName: string,
        collection: string,
        authorEmail: string,
        username: string,
    }): void {
        console.log('Stub Email Sent');
    }
}

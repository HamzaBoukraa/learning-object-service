import { ReleaseEmailGateway } from './release-email-gateway';

export class LambdaGatewayStub implements ReleaseEmailGateway {

    /**
     * A "fake" lambda function invoke used for testing
     * and development
     */
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

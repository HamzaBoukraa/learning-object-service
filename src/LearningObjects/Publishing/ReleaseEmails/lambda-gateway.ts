import { ServiceError, ServiceErrorReason } from '../../../shared/errors';
import { generateServiceToken } from '../../../drivers/TokenManager';
import { ReleaseEmailGateway } from './release-email-gateway';
import { reportError } from '../../../shared/SentryConnector';
import * as request from 'request-promise';

export class LambdaGateway implements ReleaseEmailGateway {

    /**
     * Trigger for Lambda function that is responsible for
     * dispatching release emails to learning object authors.
     *
     * The request must include a service token with the signature
     * of a ServiceToken sent from the Learning Object Service.
     */
    invokeReleaseNotification(params: {
        learningObjectName: string,
        authorName: string,
        collection: string,
        authorEmail: string,
        username: string,
    }): void {
        const postData = JSON.stringify({
            learningObjectName: params.learningObjectName,
            authorName: params.authorName,
            collection: params.collection,
            authorEmail: params.authorEmail,
            username: params.username,
        });

        request({
            uri: process.env.RELEASE_EMAIL_INVOCATION,
            json: true,
            body: postData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length,
                'Authorization': `Bearer ${generateServiceToken()}`,
            },
            method: 'POST',
        })
        .catch((e) => {
            const error = new Error(e.message);
            reportError(error);
            console.error(e);
        });
    }
}

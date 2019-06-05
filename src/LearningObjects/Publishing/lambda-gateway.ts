import { mapResponseDataToError, ServiceError, ServiceErrorReason } from '../../shared/errors';
import * as https from 'https';
import { generateServiceToken } from '../../drivers/TokenManager';
import { ReleaseEmailGateway } from './release-email-gateway';
import { reportError } from '../../shared/SentryConnector';

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

        const options = {
            // When host name is set to an empty string, an internal service error is thrown.
            hostname: process.env.RELEASE_EMAIL_INVOCATION ? process.env.RELEASE_EMAIL_INVOCATION.split('/')[0] : '',
            method: 'POST',
            path: process.env.RELEASE_EMAIL_INVOCATION ? `/${process.env.RELEASE_EMAIL_INVOCATION.split('/')[1]}` : '',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length,
                'Authorization': `Bearer ${generateServiceToken()}`,
            },
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                const error = mapResponseDataToError(res.statusCode, res.statusMessage);
                reportError(error);
            }
        });

        req.on('error', (e) => {
            throw new ServiceError(ServiceErrorReason.INTERNAL);
        });

        req.write(postData);
        req.end();
    }
}

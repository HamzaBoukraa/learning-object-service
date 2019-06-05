import { mapResponseDataToError, ServiceError, ServiceErrorReason } from '../errors';
import * as https from 'https';
import { generateServiceToken } from '../../drivers/TokenManager';

export function invokeReleaseNotification(params: {
    learningObjectName: string,
    authorName: string,
    collection: string,
    authorEmail: string,
    username: string,
}) {
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
            throw error;
        }
    });

    req.on('error', (e) => {
      throw new ServiceError(ServiceErrorReason.INTERNAL);
    });

    req.write(postData);
    req.end();
}

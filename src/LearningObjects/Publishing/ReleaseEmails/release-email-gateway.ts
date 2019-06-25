export interface ReleaseEmailGateway {
    invokeReleaseNotification(params: {
        learningObjectName: string,
        authorName: string,
        collection: string,
        authorEmail: string,
        username: string,
    }): void;
}

export abstract class FileAccessIdentityDatastore {
    abstract insertFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string,
        fileAccessIdentity: string,
    }): Promise<void>;

    abstract findFileAccessIdentity(username: string): Promise<string>;

    abstract updateFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string,
        fileAccessIdentity: string,
    }): Promise<void>;
}

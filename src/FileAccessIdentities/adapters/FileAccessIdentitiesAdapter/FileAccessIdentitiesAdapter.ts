import { getFileAccessIdentity } from '../../interactors/GetFileAccessIdentity/getFileAccessIdentity';

export class FileAccessIdentitiesAdapter {
    private static _instance: FileAccessIdentitiesAdapter;

    private constructor() {}

    static open() {
        FileAccessIdentitiesAdapter._instance = new FileAccessIdentitiesAdapter();
    }

    static getInstance(): FileAccessIdentitiesAdapter {
        if (this._instance) {
            return this._instance;
        }
        throw new Error(
            'Learning Object Submission Adapter has not been created yet.',
        );
    }

    getFileAccessIdentity(username: string) {
        return getFileAccessIdentity(username);
    }
}
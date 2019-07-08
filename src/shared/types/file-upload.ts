import { Readable } from 'stream';

export interface FileUpload {
    path: string;
    // FIXME: This should define the specific types it can take
    data: Buffer|Uint8Array|Blob|string|Readable;
}

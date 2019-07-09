import { Readable } from 'stream';

export interface FileUpload {
    path: string;
    data: Buffer|Uint8Array|Blob|string|Readable;
}

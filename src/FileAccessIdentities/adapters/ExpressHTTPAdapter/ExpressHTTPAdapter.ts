import { Router } from 'express';
import {
    createFileAccessIdentityHandler,
    getFileAccessIdentityHandler,
    updateFileAccessIdentityHandler,
} from './handlers';

export function buildHTTPAdapter() {
    const router = Router();
    router.post(
        '/file-access-identity',
        createFileAccessIdentityHandler,
    );
    router.get(
        '/file-access-identity/:username',
        getFileAccessIdentityHandler,
    );
    router.patch(
        '/file-access-identity/:usename',
        updateFileAccessIdentityHandler,
    );
}


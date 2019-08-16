import { Router } from 'express';
import {
    createFileAccessIdentityHandler,
    getFileAccessIdentityHandler,
    updateFileAccessIdentityHandler,
} from './handlers';

export function buildHTTPAdapter(): Router {
    const router = Router();
    router.post(
        '/users/:username/file-access-identity',
        createFileAccessIdentityHandler,
    );
    router.get(
        '/users/:username/file-access-identity',
        getFileAccessIdentityHandler,
    );
    router.patch(
        '/users/:username/file-access-identity',
        updateFileAccessIdentityHandler,
    );
    return router;
}


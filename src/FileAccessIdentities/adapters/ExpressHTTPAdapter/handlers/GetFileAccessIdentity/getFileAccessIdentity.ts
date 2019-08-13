import {
    Request,
    Response,
} from 'express';
import { handleError } from '../shared/HandleError/handleError';

export function getFileAccessIdentityHandler(
    req: Request,
    res: Response,
) {
    try {
        handleRequest(req, res);
    } catch (error) {
        handleError({ error, res });
    }
}

async function handleRequest(req: Request, res: Response) {
    const params = parseRequestParams(req);
    const fileAccessIdentity = getFileAccessIdentity(params);
    respondWithFileAccessIdentity({res, fileAccessIdentity});
}

function parseRequestParams(req: Request) {
    const params = {
        username: req.params.username,
        requester: req.user,
    };
    return params;
}

function respondWithFileAccessIdentity(params: {
    res: Response,
    fileAccessIdentity: string,
}) {
    params.res.status(200).json({ fileAccessIdentity: params.res });
}

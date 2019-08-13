import {
    Request,
    Response,
} from 'express';
import { handleError } from '../shared/handleError/handleError';
import { getFileAccessIdentity } from '../../../../interactors/GetFileAccessIdentity/getFileAccessIdentity';
import { checkIfRequesterHasPermission } from '../shared';

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
    checkIfRequesterHasPermission(params.requester);
    const fileAccessIdentity = await getFileAccessIdentity(params);
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

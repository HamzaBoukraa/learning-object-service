import {
    Request,
    Response,
} from 'express';
import { handleError } from '../shared/HandleError/handleError';

export function createFileAccessIdentityHandler(
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
    const resourceURL = await createFileAccessIdentity(params);
    respondWithResourceURL({res, resourceURL});
}

function parseRequestParams(req: Request) {
    const params = {
        username: req.params.username,
        fileAccessID: req.body.fileAccessID,
        requester: req.user,
    };
    return params;
}

function respondWithResourceURL(params: {
    res: Response,
    resourceURL: string,
}) {
    params.res.status(200).json({ resourceURL: params.resourceURL });
}

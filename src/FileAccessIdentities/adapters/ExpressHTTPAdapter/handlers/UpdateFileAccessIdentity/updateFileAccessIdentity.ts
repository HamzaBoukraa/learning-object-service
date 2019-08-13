import {
    Request,
    Response,
} from 'express';
import { handleError } from '../shared/HandleError/handleError';

export async function updateFileAccessIdentityHandler(
    req: Request,
    res: Response,
) {
    try {
        handleRequest(req, res);
    } catch (error) {
        handleError(error);
    }
}

async function handleRequest(req: Request, res: Response) {
    const params = parseRequestParams(req);
    const resourceURL = await updateFileAccessIdentity(params);
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

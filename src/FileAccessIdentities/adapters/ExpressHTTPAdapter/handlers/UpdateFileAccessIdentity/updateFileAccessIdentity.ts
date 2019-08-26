import { Request, Response } from 'express';
import { updateFileAccessIdentity } from '../../../../interactors/UpdateFileAccessIdentity/updateFileAccessIdentity';
import { checkIfRequesterHasPermission, handleError } from '../shared';
import { ResourceError, ResourceErrorReason } from '../../../../../shared/errors';

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

  const hasPermission = checkIfRequesterHasPermission(params.requester);
  if (!hasPermission) {
    throw new ResourceError(
      'Requester does not have access',
      ResourceErrorReason.FORBIDDEN,
    );
  }

  const resourceURL = await updateFileAccessIdentity(params);
  respondWithResourceURL({ res, resourceURL });
}

function parseRequestParams(req: Request) {
  const params = {
    username: req.params.username,
    fileAccessIdentity: req.body.fileAccessID,
    requester: req.user,
  };
  return params;
}

function respondWithResourceURL(params: {
  res: Response;
  resourceURL: string;
}) {
  params.res.status(200).json({ resourceURL: params.resourceURL });
}

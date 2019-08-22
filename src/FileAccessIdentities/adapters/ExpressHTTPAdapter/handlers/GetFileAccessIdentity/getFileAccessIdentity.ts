import { Request, Response } from 'express';
import { getFileAccessIdentity } from '../../../../interactors/GetFileAccessIdentity/getFileAccessIdentity';
import { checkIfRequesterHasPermission, handleError } from '../shared';
import { ResourceError, ResourceErrorReason } from '../../../../../shared/errors';

export function getFileAccessIdentityHandler(req: Request, res: Response) {
  try {
    handleRequest(req, res);
  } catch (error) {
    handleError({ error, res });
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

  const fileAccessIdentity = await getFileAccessIdentity(params.username);
  respondWithFileAccessIdentity({ res, fileAccessIdentity });
}

function parseRequestParams(req: Request) {
  const params = {
    username: req.params.username,
    requester: req.user,
  };
  return params;
}

function respondWithFileAccessIdentity(params: {
  res: Response;
  fileAccessIdentity: string;
}) {
  params.res.status(200).json({ fileAccessIdentity: params.res });
}

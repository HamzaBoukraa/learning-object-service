import { Request, Response } from 'express';

import { createFileAccessIdentity } from '../../../../interactors/CreateFileAccessIdentity/createFileAccessIdentity';
import { checkIfRequesterHasPermission, handleError } from '../shared';
import {
  ResourceError,
  ResourceErrorReason,
} from '../../../../../shared/errors';

export function createFileAccessIdentityHandler(req: Request, res: Response) {
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

  const resourceURL = await createFileAccessIdentity(params);
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

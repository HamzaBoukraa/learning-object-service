import { downloadSingleFile } from '../interactors/Interactor';
import { Router, Response, Request } from 'express';
import { LEARNING_OBJECT_ROUTES } from '../../shared/routes';
import { mapErrorToResponseData } from '../../shared/errors';
import { fileNotFound } from '../assets/filenotfound';
import { DownloadFilter, Requester } from '../typings';
import { downloadBundle } from '../interactors/downloadBundle/downloadBundle';
import { Gateways } from '../interactors/shared/dependencies';
import { UserToken } from '../../shared/types';

export function buildRouter(): Router {
  const router = Router();
  router.get(
    '/users/:username/learning-objects/:loId/files/:fileId/download',
    download,
  );
  router.get(
    '/users/:username/learning-objects/:loId/materials/files/:fileId/download',
    download,
  );

  router.get(
    '/users/:username/learning-objects/:cuid/versions/:version/bundle',
    getLearningObjectBundle,
  );

  return router;
}

async function download(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const open = req.query.open;
    const author: string = req.params.username;
    const loId: string = req.params.loId;
    const fileId: string = req.params.fileId;
    const filter: DownloadFilter = req.query.status;
    const { filename, mimeType, stream } = await downloadSingleFile({
      author,
      fileId,
      learningObjectId: loId,
      requester,
      filter,
    });
    if (!open) {
      res.attachment(filename);
    }
    // Set mime type only if it is known
    if (mimeType) res.contentType(mimeType);
    stream.pipe(res);
  } catch (e) {
    if (e.message === 'File not found') {
      fileNotFoundResponse(e.object, req, res);
    } else {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  }
}

async function getLearningObjectBundle(req: Request, res: Response) {
  try {
    const { username, cuid, version } = req.params;
    const requester: UserToken = req.user;

    const learningObjects = await Gateways.learningObjectGateway().getInternalLearningObjectByCuid({ username, cuid, version: parseInt(version, 10), requester });
    const stream = await downloadBundle({ learningObject: learningObjects[0], requester });

    res.header('Content-Disposition', `attachment; filename="${learningObjects[0].name}.zip"`);
    stream.pipe(res);
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

function fileNotFoundResponse(object: any, req: Request, res: Response) {
  const redirectUrl = LEARNING_OBJECT_ROUTES.CLARK_DETAILS({
    objectName: object.name,
    username: req.params.username,
  });
  res
    .status(404)
    .type('text/html')
    .send(fileNotFound(redirectUrl));
}

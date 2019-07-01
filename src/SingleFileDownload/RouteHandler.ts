import {
  downloadSingleFile,
  DownloadFilter,
} from './SingleFileDownloadInteractor';
import { Router, Response, Request } from 'express';
import { fileNotFound } from './assets/filenotfound';
import { LEARNING_OBJECT_ROUTES } from '../shared/routes';
import { DataStore } from '../shared/interfaces/DataStore';
import { FileManager } from '../shared/interfaces/FileManager';
import { mapErrorToResponseData } from '../shared/errors';
import { UserToken } from '../shared/types';

// TODO: Define DataStore just for this Feature Module
export function initializeSingleFileDownloadRouter({
  router,
  dataStore,
  fileManager,
}: {
  router: Router;
  dataStore: DataStore;
  fileManager: FileManager;
}) {
  async function download(req: Request, res: Response) {
    try {
      const requester: UserToken = req.query;
      const open = req.query.open;
      const author: string = req.params.username;
      const loId: string = req.params.loId;
      const fileId: string = req.params.fileId;
      const filter: DownloadFilter = req.query.status;
      const { filename, mimeType, stream } = await downloadSingleFile({
        author,
        fileId,
        dataStore,
        fileManager,
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
  router.get(
    '/users/:username/learning-objects/:loId/files/:fileId/download',
    download,
  );
  router.get(
    '/users/:username/learning-objects/:loId/materials/files/:fileId/download',
    download,
  );
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

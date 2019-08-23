import { Router, Request, Response } from 'express';
import * as Interactor from '../Interactor';
import {
  Requester,
  FileMetadataFilter,
  FileMetadata,
  FileMetadataUpdate,
} from '../typings';
import { mapErrorToResponseData } from '../../shared/errors';

/**
 * Builds the Express Router for this module
 *
 * @export
 * @returns
 */
export function buildRouter() {
  const router = Router();
  router
    .route('/users/:username/learning-objects/:loId/materials/files')
    .get(getAllFiles)
    .post(addFiles);
  router
    .route('/users/:username/learning-objects/:loId/materials/files/:fileId')
    .get(getFile)
    .patch(updateFile)
    .delete(deleteFile);
  return router;
}

/**
 * Transforms request data and calls interactor to get all file metadata
 *
 * @param {Request} req [The express request object]
 * @param {Response} res [The express response object]
 */
async function getAllFiles(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const filter: FileMetadataFilter = req.query.status;
    const learningObjectId: string = req.params.loId;
    const files = await Interactor.getAllFileMetadata({
      requester,
      learningObjectId,
      filter,
    });
    res.send({ files });
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

/**
 * Transforms request data and calls interactor to add file metadata
 *
 * @param {Request} req [The express request object]
 * @param {Response} res [The express response object]
 */
async function addFiles(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const learningObjectId: string = req.params.loId;
    const files: FileMetadata[] = mapToFileMeta(req.body.fileMeta);
    const fileMetadata = await Interactor.addFileMeta({
      requester,
      learningObjectId,
      files,
    });
    res.send({ files: fileMetadata });
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

/**
 * Transforms request data and calls interactor to get file metadata
 *
 * @param {Request} req [The express request object]
 * @param {Response} res [The express response object]
 */
async function getFile(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const filter: FileMetadataFilter = req.query.status;
    const learningObjectId: string = req.params.loId;
    const fileId: string = req.params.fileId;

    const file = await Interactor.getFileMetadata({
      requester,
      learningObjectId,
      filter,
      id: fileId,
    });
    res.send(file);
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

/**
 * Transforms request data and calls interactor to update file metadata
 *
 * @param {Request} req [The express request object]
 * @param {Response} res [The express response object]
 */
async function updateFile(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const learningObjectId: string = req.params.loId;
    const fileId: string = req.params.fileId;
    const updates: FileMetadataUpdate = req.body;
    await Interactor.updateFileMeta({
      id: fileId,
      requester,
      learningObjectId,
      updates,
    });
    res.sendStatus(204);
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

/**
 * Transforms request data and calls interactor to delete file metadata
 *
 * @param {Request} req [The express request object]
 * @param {Response} res [The express response object]
 */
async function deleteFile(req: Request, res: Response) {
  try {
    const requester: Requester = req.user;
    const learningObjectId: string = req.params.loId;
    const fileId: string = req.params.fileId;
    await Interactor.deleteFileMeta({
      id: fileId,
      requester,
      learningObjectId,
    });
    res.sendStatus(204);
  } catch (e) {
    const { code, message } = mapErrorToResponseData(e);
    res.status(code).json({ message });
  }
}

/**
 * Maps old request body properties to new FileMetadata properties
 *
 * @param {any[]} files
 * @returns {FileMetadata[]}
 */
function mapToFileMeta(files: any[]): FileMetadata[] {
  if (Array.isArray(files)) {
    return files.map(file => ({
      ...file,
      ETag: file.ETag || file.eTag,
      mimeType: file.mimeType || file.fileType,
    }));
  }
  return [];
}

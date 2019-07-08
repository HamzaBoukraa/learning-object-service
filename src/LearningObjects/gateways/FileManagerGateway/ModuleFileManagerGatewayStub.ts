import { FileManagerGateway } from '../../interfaces';
import { FileUpload } from '../../../shared/types';

export class FileManagerGatewayStub implements FileManagerGateway {

  /**
   * @inheritdoc
   *
   */
  uploadFile(params: { file: FileUpload; }): Promise<void> {
    return Promise.resolve();
  }

  /**
   * @inheritdoc
   */
  deleteFile(params: { path: string }): Promise<void> {
    return Promise.resolve();
  }

  /**
   * @inheritdoc
   */
  deleteFolder(params: { path: string; }): Promise<void> {
    return Promise.resolve();
  }
}

import { FileManagerModule } from '../../FileManager/FileManagerModule';
import { FileManagerGateway } from './FileManagerGateway';
import { FileUpload } from '../../shared/types';

export class ModuleFileManagerGateway implements FileManagerGateway {

  /**
   * @inheritdoc
   *
   * Proxies `uploadFile` request to FileManagerAdapter
   *
   * @memberof ModuleFileManagerGateway
   */
    uploadFile(params: {
        authorUsername: string,
        learningObjectId: string
        file: FileUpload,
    }) {
        return FileManagerModule.uploadFile(params);
    }
}

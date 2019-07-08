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
        file: FileUpload,
    }) {
        return FileManagerModule.uploadFile({
            file: params.file,
        });
    }
}

import { FileManagerAdapter } from '../../FileManager/adapters/FileManagerAdapter';
import { FileUpload } from '../../FileManager/interfaces/FileManager';
import { FileManagerGateway } from '../../FileMetadata/interfaces/FileManagerGateway';

export class ModuleFileManagerGateway extends FileManagerGateway {
    private adapter: FileManagerAdapter = FileManagerAdapter.getInstance();

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
        return this.adapter.uploadFile({
            file: params.file,
        });
    }
}

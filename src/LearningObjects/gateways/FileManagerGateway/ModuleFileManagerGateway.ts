import { FileManagerModule } from '../../../FileManager/FileManagerModule';
import { FileManagerGateway } from '../../interfaces';
import { FileUpload } from '../../../shared/types';

export class ModuleFileManagerGateway extends FileManagerGateway {

    /**
     * @inheritdoc
     * Proxies the FileManagerModule's `uploadFile` method
     * @memberof ModuleFileManagerGateway
     */
    uploadFile(params: { file: FileUpload; }): Promise<void> {
        return FileManagerModule.uploadFile(params);
    }

   /**
    * @inheritdoc
    * Proxies the FileManagerModule's `deleteFile` method
    */
    deleteFile(params: { path: string; }): Promise<void> {
        return FileManagerModule.deleteFile({
            path: params.path,
        });
    }

   /**
    * @inheritdoc
    * Proxies the FileManagerModule's `deleteFolder` method
    */
    deleteFolder(params: { path: string; }): Promise<void> {
        return FileManagerModule.deleteFolder({
            path: params.path,
        });
    }
}


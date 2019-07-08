import { FileManagerModule } from '../../../FileManager/FileManagerModule';
import { FileManagerGateway } from '../../interfaces';

export class ModuleFileManagerGateway extends FileManagerGateway {
    /**
     * @inheritdoc
     * Proxies the FileManagerModule's `deleteFile` method
     */
    deleteFile(params: { authorUsername: string; learningObjectId: string; path: string; }): Promise<void> {
        return FileManagerModule.deleteFile(params);
    }

    /**
     * @inheritdoc
     * Proxies the FileManagerModule's `deleteFolder` method
     */
    deleteFolder(params: { authorUsername: string; learningObjectId: string; path: string; }): Promise<void> {
        return FileManagerModule.deleteFolder(params);
    }
}


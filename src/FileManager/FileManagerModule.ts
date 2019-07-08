import { expressServiceModule, ExpressServiceModule } from 'node-service-module';
import { ExpressHttpAdapter } from './adapters';
import { uploadFile, deleteFile, deleteFolder } from './Interactor';
import { FileManager, LearningObjectGateway, FileMetadataGateway } from './interfaces';
import { S3FileManager, ModuleLearningObjectGateway, FileMetadataModuleGateway } from './drivers';

/**
 * Module responsible for handling file operations
 *
 * @export
 * @class FileManager
 * @extends {ExpressServiceModule}
 */
@expressServiceModule({
    expressRouter: ExpressHttpAdapter.buildRouter(),
    providers: [
        { provide: FileManager, useClass: S3FileManager },
        { provide: LearningObjectGateway, useClass: ModuleLearningObjectGateway },
        { provide: FileMetadataGateway, useClass: FileMetadataModuleGateway },
    ],
})
export class FileManagerModule extends ExpressServiceModule {
    static uploadFile = uploadFile;
    static deleteFile = deleteFile;
    static deleteFolder = deleteFolder;
}


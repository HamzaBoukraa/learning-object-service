import { expressServiceModule, ExpressServiceModule } from 'node-service-module';
import { ExpressHttpAdapter } from './adapters';
import { S3Driver } from '../drivers/drivers';
import { FileManager } from '../shared/interfaces/interfaces';
import { FileManagerAdapterStub } from './adapters/FileManagerAdapterStub';
import { LearningObjectGateway } from './interfaces/LearningObjectGateway';
import { ModuleLearningObjectGateway } from './drivers/LearningObjectGateway/ModuleLearningObjectGateway';
import { FileManagerAdapter } from './adapters/FileManagerAdapter';
import { uploadFile } from './Interactor';

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
        { provide: FileManager, useClass: S3Driver },
        { provide: LearningObjectGateway, useClass: ModuleLearningObjectGateway },
    ],
})
export class FileManagerModule extends ExpressServiceModule {
    static uploadFile = uploadFile;
}

const Adapter = process.env.NODE_ENV === 'testing'
 ? FileManagerAdapter
 : FileManagerAdapterStub;
export { Adapter as FileManagerAdapter };

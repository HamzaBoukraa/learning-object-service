import { expressServiceModule, ExpressServiceModule } from 'node-service-module';
import { ExpressHttpAdapter } from './adapters';
import { S3Driver } from '../drivers/drivers';
import { FileManager } from '../shared/interfaces/interfaces';
import { FileManagerModuleDatastore } from './interfaces/FileManagerModuledatastore';
import { MongoFileManagerModuleDatastore } from './drivers/FileManagerModuleDatastore/MongoFileManagerModuleDatastore';

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
        { provide: FileManagerModuleDatastore, useClass: MongoFileManagerModuleDatastore },
    ],
})
export class FileManagerModule extends ExpressServiceModule {

}
import { FileManagerAdapterStub } from './FileManagerAdapterStub';

const Adapter = process.env.NODE_ENV === 'testing'
 ? FileManagerAdapter
 : FileManagerAdapterStub;
export { Adapter as FileManagerAdapter };

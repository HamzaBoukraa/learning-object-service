import { expressServiceModule, ExpressServiceModule } from 'node-service-module';
import { ExpressHttpAdapter } from './adapters';
import { S3Driver } from '../drivers/drivers';
import { FileManager } from '../shared/interfaces/interfaces';

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
        { provide: FileManager, useClass: S3Driver  },
    ],
})
export class FileManagerModule extends ExpressServiceModule {

}

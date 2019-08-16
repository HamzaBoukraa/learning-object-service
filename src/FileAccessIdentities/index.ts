import {
    ExpressServiceModule,
    expressServiceModule,
} from 'node-service-module';
import { MongoDBFileAccessIdentityDatastore } from './gateways/FileAccessIdentityDatastore/MongoDBFileAccessIdentityDatastore';
import { FileAccessIdentityDatastore } from './shared/abstract-classes/FileAccessIdentityDatastore';
import { buildHTTPAdapter } from './adapters/ExpressHTTPAdapter/ExpressHTTPAdapter';

@expressServiceModule({
    expressRouter: buildHTTPAdapter(),
    providers: [
        {
            useClass: MongoDBFileAccessIdentityDatastore,
            provide: FileAccessIdentityDatastore,
        },
    ],
})
export class FileAccessIdentities extends ExpressServiceModule {}

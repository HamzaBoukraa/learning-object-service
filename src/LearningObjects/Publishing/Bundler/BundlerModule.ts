import { ArchiverBundler } from './ArchiverBundler';
import { ServiceModule, serviceModule } from 'node-service-module';
import { Bundler } from './Bundler';
import { LicenseRetriever } from './LicenseRetriever';
import { HttpLicenseRetriever } from './HttpLicenseRetriever';
import { FileGateway } from './FileGateway';
import { FileManagerModule } from '../../../FileManager/FileManagerModule';

@serviceModule({
  providers: [
    { provide: Bundler, useClass: ArchiverBundler },
    { provide: LicenseRetriever, useClass: HttpLicenseRetriever },
    { provide: FileGateway, useClass: FileManagerModule },
  ],
})
export class BundlerModule extends ServiceModule {}

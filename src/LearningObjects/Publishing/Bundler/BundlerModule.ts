import { ArchiverBundler } from './ArchiverBundler';
import { ServiceModule, serviceModule } from 'node-service-module';
import { Bundler } from './Bundler';
import { LicenseRetriever } from './LicenseRetriever';
import { HttpLicenseRetriever } from './HttpLicenseRetriever';
import { FileGateway } from './FileGateway';
import { ModuleFileGateway } from './ModuleFileGateway';

@serviceModule({
  providers: [
    { provide: Bundler, useClass: ArchiverBundler },
    { provide: LicenseRetriever, useClass: HttpLicenseRetriever },
    { provide: FileGateway, useClass: ModuleFileGateway },
  ],
})
export class BundlerModule extends ServiceModule {}

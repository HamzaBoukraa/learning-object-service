import { ArchiverBundler } from './ArchiverBundler';
import { ServiceModule, serviceModule } from 'node-service-module';
import { Bundler } from './Bundler';
import { CCLicenseRetriever } from './CCLicenseRetriever';
import { HttpCCLicenseRetriever } from './HttpCCLicenseRetriever';
import { FileGateway } from './FileGateway';

@serviceModule({
  providers: [
    { provide: Bundler, useClass: ArchiverBundler },
    { provide: CCLicenseRetriever, useClass: HttpCCLicenseRetriever },
    { provide: FileGateway, useClass: null },
  ],
})
export class BundlerModule extends ServiceModule {}

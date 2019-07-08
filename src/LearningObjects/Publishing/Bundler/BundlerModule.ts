import { ArchiverBundler } from './ArchiverBundler';
import { ServiceModule, serviceModule } from 'node-service-module';
import { Bundler } from './Bundler';
import { CCLicenseRetriever } from './CCLicenseRetriever';
import { HttpCCLicenseRetriever } from './HttpCCLicenseRetriever';

@serviceModule({
  providers: [
    { provide: Bundler, useClass: ArchiverBundler },
    { provide: CCLicenseRetriever, useClass: HttpCCLicenseRetriever },
  ],
})
export class BundlerModule extends ServiceModule {}

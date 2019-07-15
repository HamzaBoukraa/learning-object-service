import { ServiceModule, serviceModule } from 'node-service-module';
import { Bundler, LicenseRetriever, FileGateway } from './interfaces';
import { ArchiverBundler, HttpLicenseRetriever } from './drivers';
import { ModuleFileGateway } from './gateways';

@serviceModule({
  providers: [
    { provide: Bundler, useClass: ArchiverBundler },
    { provide: LicenseRetriever, useClass: HttpLicenseRetriever },
    { provide: FileGateway, useClass: ModuleFileGateway },
  ],
})
export class BundlerModule extends ServiceModule {}

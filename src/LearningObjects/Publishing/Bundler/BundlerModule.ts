import { ArchiverBundler } from './drivers/Bundler/ArchiverBundler';
import { ServiceModule, serviceModule } from 'node-service-module';
import { Bundler } from './interfaces';

@serviceModule({
  providers: [
    { provide: Bundler, useClass: ArchiverBundler },
  ],
})
export class BundlerModule extends ServiceModule {}

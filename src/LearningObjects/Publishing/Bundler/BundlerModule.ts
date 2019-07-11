import { ArchiverBundler } from './ArchiverBundler';
import { ServiceModule, serviceModule } from 'node-service-module';
import { Bundler } from './Bundler';

@serviceModule({
  providers: [{ provide: Bundler, useClass: ArchiverBundler }],
})
export class BundlerModule extends ServiceModule {}

import { ServiceModule, serviceModule } from 'node-service-module';
import { FileMetadataGateway, ReadMeBuilder } from './interfaces';
import { ModuleFileMetadataGateway } from './gateways';
import { PDFKitReadMeBuilder } from './drivers';
@serviceModule({
  providers: [
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: ReadMeBuilder, useClass: PDFKitReadMeBuilder },
  ],
})
export class LearningObjectsModule extends ServiceModule {}

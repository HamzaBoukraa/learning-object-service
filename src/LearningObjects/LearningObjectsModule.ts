import { ServiceModule, serviceModule } from 'node-service-module';
import {
  FileMetadataGateway,
  ReadMeBuilder,
  FileManagerGateway,
} from './interfaces';
import { PDFKitReadMeBuilder } from './drivers';
import {
  ModuleFileMetadataGateway,
  ModuleFileManagerGateway,
} from './gateways';
@serviceModule({
  providers: [
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: FileManagerGateway, useClass: ModuleFileManagerGateway },
    { provide: ReadMeBuilder, useClass: PDFKitReadMeBuilder },
  ],
})
export class LearningObjectsModule extends ServiceModule {}

import { ServiceModule, serviceModule } from 'node-service-module';
import {
  FileMetadataGateway,
  ReadMeBuilder,
  FileManagerGateway,
} from './interfaces';
import {
  ModuleFileMetadataGateway,
  ModuleFileManagerGateway,
} from './gateways';
import { PDFKitReadMeBuilder } from './drivers';
@serviceModule({
  providers: [
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: FileManagerGateway, useClass: ModuleFileManagerGateway },
    { provide: ReadMeBuilder, useClass: PDFKitReadMeBuilder },
  ],
})
export class LearningObjectsModule extends ServiceModule {}

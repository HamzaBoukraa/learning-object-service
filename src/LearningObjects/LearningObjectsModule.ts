import { ServiceModule, serviceModule } from 'node-service-module';
import {
  FileMetadataGateway,
  ReadMeBuilder,
  FileManagerGateway,
  UserGateway,
} from './interfaces';
import { PDFKitReadMeBuilder } from './drivers';
import {
  ModuleFileMetadataGateway,
  ModuleFileManagerGateway,
  HttpUserGateway,
} from './gateways';
@serviceModule({
  providers: [
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: FileManagerGateway, useClass: ModuleFileManagerGateway },
    { provide: ReadMeBuilder, useClass: PDFKitReadMeBuilder },
    { provide: UserGateway, useClass: HttpUserGateway },
  ],
})
export class LearningObjectsModule extends ServiceModule {}

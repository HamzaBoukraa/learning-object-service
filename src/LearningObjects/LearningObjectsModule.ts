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
import { UserGateway } from './interfaces/UserGateway';
import { ModuleUserGateway } from './gateways/UserGateway/ModuleUserGateway';
@serviceModule({
  providers: [
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: FileManagerGateway, useClass: ModuleFileManagerGateway },
    { provide: ReadMeBuilder, useClass: PDFKitReadMeBuilder },
    { provide: UserGateway, useClass: ModuleUserGateway },
  ],
})
export class LearningObjectsModule extends ServiceModule {}

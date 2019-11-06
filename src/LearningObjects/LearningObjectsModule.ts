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
import { LearningObjectSubmissionGateway } from './interfaces/LearningObjectSubmissionGateway';
import { ModuleLearningObjectSubmissionGateway } from './gateways/LearningObjectSubmissions/ModuleLearningObjectSubmissionGateway';
@serviceModule({
  providers: [
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: FileManagerGateway, useClass: ModuleFileManagerGateway },
    { provide: ReadMeBuilder, useClass: PDFKitReadMeBuilder },
    { provide: UserGateway, useClass: HttpUserGateway },
    { provide: LearningObjectSubmissionGateway, useClass: ModuleLearningObjectSubmissionGateway },
  ],
})
export class LearningObjectsModule extends ServiceModule {}

import { ServiceModule, serviceModule } from 'node-service-module';
import {
  FileMetadataGateway,
  ReadMeBuilder,
  FileManagerGateway,
} from './interfaces';
import { PDFKitReadMeBuilder } from './drivers';
import { FileMetadataModule } from '../FileMetadata/FileMetadataModule';
import { FileManagerModule } from '../FileManager/FileManagerModule';
@serviceModule({
  providers: [
    { provide: FileMetadataGateway, useClass: FileMetadataModule },
    { provide: FileManagerGateway, useClass: FileManagerModule },
    { provide: ReadMeBuilder, useClass: PDFKitReadMeBuilder },
  ],
})
export class LearningObjectsModule extends ServiceModule {}

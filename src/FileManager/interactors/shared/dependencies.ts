import {
    FileManager,
    LearningObjectGateway,
    FileMetadataGateway,
} from '../../interfaces';
import { FileManagerModule } from '../../FileManagerModule';

export namespace Drivers {
    export const fileManager = () =>
      FileManagerModule.resolveDependency(FileManager);
  }

export namespace Gateways {
    export const learningObjectGateway = () =>
        FileManagerModule.resolveDependency(LearningObjectGateway);
    export const fileMetadataGateway = () =>
        FileManagerModule.resolveDependency(FileMetadataGateway);
}

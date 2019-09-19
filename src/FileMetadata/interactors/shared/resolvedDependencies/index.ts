import { FileMetadataModule } from '../../../FileMetadataModule';
import {
    FileMetaDatastore,
    LearningObjectGateway,
    FileManagerGateway,
} from '../../../interfaces';

export namespace Drivers {
    export const datastore = () =>
      FileMetadataModule.resolveDependency(FileMetaDatastore);
}

export namespace Gateways {
    export const learningObjectGateway = () =>
        FileMetadataModule.resolveDependency(LearningObjectGateway);
    export const fileManager = () =>
        FileMetadataModule.resolveDependency(FileManagerGateway);
}

import {
    FileManager,
    LearningObjectGateway,
    FileMetadataGateway,
} from '../../interfaces';
import { FileManagerModule } from '../../FileManagerModule';
import { HierarchyGateway } from '../../gateways/HierarchyGateway/ModuleHierarchyGateway';
import { UtilityDriverAbstract } from '../../UtilityDriverAbstract';

export namespace Drivers {
    export const fileManager = () =>
      FileManagerModule.resolveDependency(FileManager);
    export const utility = () =>
        FileManagerModule.resolveDependency(UtilityDriverAbstract);
  }


export namespace Gateways {
    export const learningObjectGateway = () =>
        FileManagerModule.resolveDependency(LearningObjectGateway);
    export const fileMetadataGateway = () =>
        FileManagerModule.resolveDependency(FileMetadataGateway);
    export const hierarchyGateway = () =>
        FileManagerModule.resolveDependency(HierarchyGateway);
}

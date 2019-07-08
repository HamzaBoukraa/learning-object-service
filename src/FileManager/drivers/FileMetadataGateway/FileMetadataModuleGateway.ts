import { FileMetadataGateway } from '../../interfaces/FileMetadataGateway';
import { UserToken } from '../../../shared/types';
import { LearningObject } from '../../../shared/entity';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { FileMetadataModule } from '../../../FileMetadata/FileMetadataModule';

export class FileMetadataModuleGateway implements FileMetadataGateway {

    /**
     * @inhertidoc
     *
     * Proxies FileMetadata module's `getFileMetadata`
     * @returns {Promise<LearningObject.Material.File>}
     * @memberof FileMetadataModuleGateway
     */
    getFileMetadata(params: {
        requester: UserToken;
        learningObjectId: string;
        id: string;
        filter: FileMetadataFilter;
    }): Promise<LearningObject.Material.File> {
        return FileMetadataModule.getFileMetadata(params);
    }
}

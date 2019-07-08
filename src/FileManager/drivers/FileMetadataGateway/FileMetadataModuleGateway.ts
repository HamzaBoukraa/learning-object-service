import { FileMetadataGateway } from '../../interfaces/FileMetadataGateway';
import { UserToken } from '../../../shared/types';
import { LearningObject } from '../../../shared/entity';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { FileMetadata } from '../../../FileMetadata';

export class FileMetadataModuleGateway extends FileMetadataGateway {

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
        return FileMetadata.getFileMetadata(params);
    }
}

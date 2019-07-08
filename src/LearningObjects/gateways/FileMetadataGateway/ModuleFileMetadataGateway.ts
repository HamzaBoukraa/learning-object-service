import { LearningObject } from '../../../shared/entity';
import { UserToken } from '../../../shared/types';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { FileMetadata } from '../../../FileMetadata';
import { FileMetadataGateway } from '../../interfaces';

export class ModuleFileMetadataGateway implements FileMetadataGateway {

    /**
     * @inheritdoc
     *
     * Proxies FileMetadata module's `getAllFileMetadata`
     *
     *
     * @returns {Promise<LearningObject.Material.File[]>}
     * @memberof ModuleFileMetadataGateway
     */
    getAllFileMetadata(params: { requester: UserToken; learningObjectId: string; filter: FileMetadataFilter; }): Promise<LearningObject.Material.File[]> {
        return FileMetadata.getAllFileMetadata(params);
    }
    /**
     * @inheritdoc
     *
     * Proxies FileMetadata module's `deleteAllFileMetadata`
     *
     *
     * @returns {Promise<LearningObject.Material.File[]>}
     * @memberof ModuleFileMetadataGateway
     */
    deleteAllFileMetadata(params: { requester: UserToken; learningObjectId: string; }): Promise<void> {
        return FileMetadata.deleteAllFileMetadata(params);
    }
}

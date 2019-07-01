import { FileMetadataGateway } from '../../interfaces/FileMetadataGateway';
import { UserToken } from '../../../shared/types';
import { FileMetadataAdapter } from '../../../FileMetadata/adapters/FileMetadataAdapter';
import { LearningObject } from '../../../shared/entity';
import { FileMetadataFilter } from '../../../FileMetadata/typings';

export class FileMetadataModuleGateway extends FileMetadataGateway {
    private adapter: FileMetadataAdapter = FileMetadataAdapter.getInstance();

    async getFileMeta(params: {
        requester: UserToken;
        learningObjectId: string;
        id: string;
        filter: FileMetadataFilter;
    }): Promise<LearningObject.Material.File> {
        return await this.adapter.getFileMeta(params);
    }
}
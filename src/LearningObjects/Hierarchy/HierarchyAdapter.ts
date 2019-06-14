import { DataStore } from '../../shared/interfaces/DataStore';
import { fetchParents } from './HierarchyInteractor';
import { UserToken } from '../../shared/types';
import { LearningObject } from '../../shared/entity';

export class HierarchyAdapter {

    private static _instance: HierarchyAdapter;

    private constructor(private dataStore: DataStore) {}

    /**
     * Creates an instance of HierarchyAdapter if one
     * does not already exist
     */
    static open(dataStore: DataStore) {
        if (!this._instance) {
            this._instance = new HierarchyAdapter(dataStore);
        }
        throw new Error('HierarchyAdapter has already been created.');
    }

    /**
     * Return singleton instance of HierarchyAdapter class
     * if it exists
     */
    static getInstance() {
        if (this._instance) {
            return this._instance;
        }
        throw new Error('HierarchyAdapter has not been created yet.');
    }

    /**
     * Proxy function to call fetchParents function in
     * HierarchyInteractor
     */
    async fetchParents(params: {
        learningObjectID: string,
        userToken: UserToken,
    }): Promise<LearningObject[]> {
        return await fetchParents({
            dataStore: this.dataStore,
            learningObjectID: params.learningObjectID,
            userToken: params.userToken,
        });
    }
}

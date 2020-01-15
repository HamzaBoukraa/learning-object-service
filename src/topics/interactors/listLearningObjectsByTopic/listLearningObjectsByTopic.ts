import { LearningObject } from '../../../shared/entity';
import { TopicsModule } from '../../topicsModule';
import { TopicsDatastore } from '../../interfaces/datastore/TopicsDatastore';

export namespace Drivers {
    export const datastore = () =>
      TopicsModule.resolveDependency(TopicsDatastore);
}


export async function listLearningObjectsByTopic(topic: string): LearningObject[] {
    const learningObjects = await Drivers.datastore().getLearningObjectsByTopic(topic);
    return learningObjects;
}

import { LearningObject } from '../../shared/entity';

export abstract class ReadMeBuilder {

    /**
     * Builds ReadMe for the given Learning Object
     *
     * @abstract
     * @param {LearningObject} learningObject [The Learning Object to build ReadMe for]
     * @returns {Promise<Buffer>}
     * @memberof ReadMeBuilder
     */
    abstract buildReadMe(
        learningObject: LearningObject,
    ): Promise<Buffer>;
}

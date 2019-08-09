  /**
   * Generates released Learning Object from Document
   *
   * @private
   * @param {User} author
   * @param {ReleasedLearningObjectDocument} record
   * @param {boolean} [full]
   * @returns {Promise<LearningObject>}
   * @memberof MongoDriver
   */
  export async function generateReleasedLearningObject(
    author: User,
    record: ReleasedLearningObjectDocument,
    full?: boolean,
  ): Promise<LearningObject> {
    // Logic for loading any learning object
    let learningObject: LearningObject;
    let materials: LearningObject.Material;
    let contributors: User[] = [];
    let children: LearningObject[] = [];
    let outcomes: LearningOutcome[] = [];
    // Load Contributors
    if (record.contributors && record.contributors.length) {
      contributors = await Promise.all(
        record.contributors.map(userId => this.fetchUser(userId)),
      );
    }
    // If full object requested, load up non-summary properties
    if (full) {
      // Logic for loading 'full' learning objects
      materials = <LearningObject.Material>record.materials;
      for (let i = 0; i < record.outcomes.length; i++) {
        const mappings = await this.learningOutcomeStore.getAllStandardOutcomes(
          {
            ids: record.outcomes[i].mappings,
          },
        );
        outcomes.push(
          new LearningOutcome({
            ...record.outcomes[i],
            mappings: mappings,
            id: record.outcomes[i]['_id'],
          }),
        );
      }
    }
    learningObject = new LearningObject({
      id: record._id,
      author,
      name: record.name,
      date: record.date,
      length: record.length as LearningObject.Length,
      levels: record.levels as LearningObject.Level[],
      collection: record.collection,
      status: record.status as LearningObject.Status,
      description: record.description,
      materials,
      contributors,
      outcomes: outcomes,
      hasRevision: record.hasRevision,
      children,
      revision: record.revision,
    });
    return learningObject;
  }
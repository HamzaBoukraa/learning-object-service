  /**
   * Converts Learning Object to Document
   *
   * @private
   * @param {LearningObject} object
   * @param {boolean} [isNew]
   * @param {string} [id]
   * @returns {Promise<LearningObjectDocument>}
   * @memberof MongoDriver
   */
  export async function documentLearningObject(
    object: LearningObject,
  ): Promise<LearningObjectDocument> {
    const authorID = await this.findUser(object.author.username);
    let contributorIds: string[] = [];

    if (object.contributors && object.contributors.length) {
      contributorIds = await Promise.all(
        object.contributors.map(user => this.findUser(user.username)),
      );
    }

    const doc: LearningObjectDocument = {
      _id: object.id || new ObjectID().toHexString(),
      authorID: authorID,
      name: object.name,
      date: object.date,
      length: object.length,
      levels: object.levels,
      description: object.description,
      materials: object.materials,
      contributors: contributorIds,
      collection: object.collection,
      status: object.status,
      children: object.children.map(obj => obj.id),
      revision: object.revision,
    };

    return doc;
  }
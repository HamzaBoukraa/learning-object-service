import { RevisionsDataStore } from './RevisionsDataStore';
import { Db, ObjectId } from 'mongodb';
import { MongoConnector } from '../shared/MongoDB/MongoConnector';
import { LearningObject } from '../shared/entity';
import { LearningObjectDocument, LearningOutcomeDocument } from '../shared/types';

export class RevisionsMongoDriver implements RevisionsDataStore {
  private onionDb: Db;
  private filesDb: Db;

  constructor() {
    this.onionDb = MongoConnector.client().db();
    this.filesDb = MongoConnector.client().db('file-service');
  }

  /**
   * Create a new revision for the Learning Object with the corresponding CUID
   *
   * @param {string} cuid
   * @param {(LearningObject.Status.UNRELEASED | LearningObject.Status.PROOFING)} [revisionStatus=LearningObject.Status.UNRELEASED]
   * @returns
   * @memberof RevisionsMongoDriver
   */
  async createRevision(cuid: string, newRevisionId: number, revisionStatus: LearningObject.Status.UNRELEASED | LearningObject.Status.PROOFING = LearningObject.Status.UNRELEASED) {
    const objectsForCUID = await this.onionDb.collection('objects').find({ cuid }).toArray();

    // at this point we know there is no revision made yet, the released object was the only object returned from the query
    const releasedObject: LearningObjectDocument = objectsForCUID[0];

    const originalId = releasedObject._id;
    const newId = new ObjectId().toHexString();

    // update the properties of the duplicate
    releasedObject._id = newId;
    releasedObject.status = revisionStatus;
    releasedObject.revision = newRevisionId;
    releasedObject.isRevision = true;

    // we've created the new Learning Object, now let's attempt to duplicate it's external resources
    let outcomes: LearningOutcomeDocument[] = await this.onionDb.collection('learning-outcomes').find({ source: originalId }).toArray();
    if (outcomes && outcomes.length) {
      outcomes = outcomes.map(o => {
        o.source = newId;
        o._id = new ObjectId().toHexString();

        return o;
      });
      await this.onionDb.collection('learning-outcomes').insertMany(outcomes);
    }

    let files: any[] = await this.filesDb.collection('files').find({ learningObjectId: originalId }).toArray();
    if (files && files.length) {
      files = files.map(f => {
        f.learningObjectId = newId;
        f._id = new ObjectId();

        return f;
      });

      await this.filesDb.collection('files').insertMany(files);
    }

    // at this point we know that the above copy-operations succeeded, lets duplicate the object
    await this.onionDb.collection('objects').insertOne(releasedObject);
  }
}

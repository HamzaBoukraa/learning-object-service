import {
    LearningObject,
    User,
    Collection,
    Outcome,
    LearningOutcome,
    StandardOutcome,
} from '../shared/entity';
import { UserToken } from '../shared/types';
import { ChangeLogDocument } from '../shared/types/changelog';

// tslint:disable-next-line:no-require-imports
let SEED_DATA = require('../../test_environment/data');

export class Stubs {
    private _learningObject: LearningObject;
    private _learningObjectChild: LearningObject;
    private _collection: Collection;
    private _changelog: ChangeLogDocument;
    private _outcome: Outcome;
    private _standardOutcome: StandardOutcome;
    private _learningOutcome: LearningOutcome;
    private _user: User;
    private _userToken: UserToken;
    private _submission: any;
    private _learningObjectFile: LearningObject.Material.File;
    private _uploadStatus: any;
    private _metrics: { saves: number, downloads: number };

    constructor() {
        this._user = new User({...SEED_DATA.AUTHOR_MOCK, id: SEED_DATA.AUTHOR_MOCK._id});
        this._learningObjectChild = new LearningObject(
            this.generateLearningObject(
                this.user,
                SEED_DATA.LEARNING_OBJECT_CHILD,
                false,
            ),
        );
        this._learningObject = new LearningObject(
            this.generateLearningObject(
                this.user,
                SEED_DATA.LEARNING_OBJECT_RELEASED_1,
                true,
            ),
        );
        this._collection = SEED_DATA.C5_COLLECTION_MOCK;
        this._changelog = SEED_DATA.CHANGELOG_MOCK;
        this._outcome = SEED_DATA.OUTCOME_MOCK;
        this._standardOutcome = new StandardOutcome({...SEED_DATA.STANDARD_OUTCOME, id: SEED_DATA.STANDARD_OUTCOME._id});
        this._learningOutcome = new LearningOutcome({...SEED_DATA.LEARNING_OUTCOME_MOCK, id: SEED_DATA.LEARNING_OUTCOME_MOCK.id});
        this._userToken = {
            username: this.user.username,
            name: this.user.name,
            email: this.user.email,
            organization:  this.user.organization,
            emailVerified: this.user.emailVerified,
            accessGroups: [],
        };
        this._submission = {
            collection: 'c5',
            timestamp: 'date',
            learningObjectId: 'default_id',
        };
        this._learningObjectFile = SEED_DATA.LEARNING_OBJECT_FILE;
        this._uploadStatus = SEED_DATA.MULTIPART_UPLOAD_STATUS;
        this._metrics = SEED_DATA.METRICS;
    }

    get learningObject(): LearningObject {
        return this._learningObject;
    }

    set learningObject(learningObject: LearningObject) {
        this._learningObject = learningObject;
    }

    get learningObjectChild(): LearningObject {
        return this._learningObjectChild;
    }

    set learningObjectChild(learningObjectChild: LearningObject) {
        this._learningObjectChild = learningObjectChild;
    }

    get collection(): Collection {
        return this._collection;
    }

    set collection(collection: Collection) {
        this._collection = collection;
    }

    get changelog(): ChangeLogDocument {
        return this._changelog;
    }

    set changelog(changelog: ChangeLogDocument) {
        this._changelog = changelog;
    }

    get outcome(): Outcome {
        return this._outcome;
    }

    set outcome(outcome: Outcome) {
        this._outcome = outcome;
    }

    get standardOutcome(): StandardOutcome {
        return this._standardOutcome;
    }

    set standardOutcome(standardOutcome: StandardOutcome) {
        this._standardOutcome = standardOutcome;
    }

    get learningOutcome(): LearningOutcome {
        return this._learningOutcome;
    }

    set learningOutcome(learningOutcome: LearningOutcome) {
        this._learningOutcome = learningOutcome;
    }

    get user(): User {
        return this._user;
    }

    set user(user: User) {
        this._user = user;
    }

    get userToken(): UserToken {
        return this._userToken;
    }

    set userToken(userToken: UserToken) {
        this._userToken = userToken;
    }

    get submission(): any {
        return this._submission;
    }

    set submission(submission: any) {
        this._submission = submission;
    }

    get learningObjectFile(): LearningObject.Material.File {
        return this._learningObjectFile;
    }

    set learningObjectFile(learningObjectFile: LearningObject.Material.File) {
        this._learningObjectFile = learningObjectFile;
    }

    get uploadStatus(): any {
        return this._uploadStatus;
    }

    set uploadStatus(uploadStatus: any) {
        this._uploadStatus = uploadStatus;
    }

    get metrics(): { saves: number, downloads: number } {
        return this._metrics;
    }

    set metrics(metrics: { saves: number, downloads: number}) {
        this._metrics = metrics;
    }
  /**
   * Generates Learning Object from untyped js module object
   *
   * @private
   * @param {User} author
   * @param {any} record
   * @returns {LearningObject}
   * @memberof Stub
   */
  private generateLearningObject(
    author: User,
    record: any,
    hasChild: boolean,
  ): LearningObject {
    try {
        let materials: LearningObject.Material;
        let contributors: User[] = [];
        let outcomes: LearningOutcome[] = [];
        let children: LearningObject[];

        if (hasChild) {
            children = [this.learningObjectChild];
        } else {
            children = [];
        }

        record.contributors = [this.user];
        materials = <LearningObject.Material>record.materials;
        outcomes = [this.learningOutcome];

        const learningObject = new LearningObject({
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
          outcomes,
          hasRevision: record.hasRevision,
          children,
        });

        return learningObject;
    } catch (error) {
        throw error;
    }
  }

}





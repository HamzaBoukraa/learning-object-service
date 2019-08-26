import { LearningOutcomeDatastore } from './datastores/LearningOutcomeDataStore';
import { MockLearningOutcomeDatastore } from './datastores/MockLearningOutcomeDatastore';
import * as LearningOutcomeInteractor from './LearningOutcomeInteractor';
import { UserToken } from '../shared/types';
import { LearningOutcome } from '../shared/entity';
import { LearningObjectGateway } from './gateways/ModuleLearningObjectGateway';
import { MockLearningObjectGateway } from './gateways/MockLearningObjectGateway';
import { ResourceError } from '../shared/errors';

export class UserStub implements UserToken {
  username = 'testuser';
  name = 'Test User';
  email = 'testuser@imatestuser.com';
  organization = 'Cyber4All';
  emailVerified = true;
  accessGroups: string[] = [];
}

let dataStore: LearningOutcomeDatastore;
let learningObjectGateway: LearningObjectGateway;

describe('LearningOutcomeInteractor', () => {
  beforeAll(async () => {
    dataStore = new MockLearningOutcomeDatastore();
    learningObjectGateway = new MockLearningObjectGateway();
  });

  describe('When getAllLearningOutcomes is called', () => {
    describe('and the user makes a valid request', () => {
      it('should return all learning outcomes for a given learning object', async () => {
        expect.assertions(3);
        const outcomes = await LearningOutcomeInteractor.getAllLearningOutcomes(
          {
            dataStore,
            requester: new UserStub(),
            learningObjectGateway,
            source: 'someObjectId',
          },
        );
        expect(outcomes).toBeDefined();
        expect(outcomes.length).toBeGreaterThan(0);

        // check that all values of the array are instances of LearningOutcome
        expect(outcomes.map(x => x instanceof LearningOutcome).filter(x => x === false).length).toBe(0);
      });
    });
  });

  describe('When addLearningOutcome is called', () => {
    describe('and the user makes a valid request', () => {
      it('should return the id of the newly-created learning outcome', async () => {
        expect.assertions(2);

        const id = await LearningOutcomeInteractor.addLearningOutcome(
          {
            dataStore,
            user: new UserStub(),
            source: 'somObjectId',
            outcomeInput: { verb: 'remember', bloom: 'remember and understand' },
          },
        );

        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });
    });

    describe('and the user makes an invalid request', () => {
      it('should throw a ResourceError', async () => {
        expect.assertions(1);

        let promise = LearningOutcomeInteractor.addLearningOutcome(
          {
            dataStore,
            user: new UserStub(),
            source: 'someObjectId',
            outcomeInput: { verb: 'nonsense', bloom: 'extra nonsense' },
          },
        );

        expect(promise).rejects.toBeInstanceOf(ResourceError);
      });
    });
  });

  describe('When getLearningOutcome is called', () => {
    describe('and the user makes a valid request', () => {
      it('should return an instance of Learning Outcome', async () => {
        expect.assertions(1);
        const outcome = await LearningOutcomeInteractor.getLearningOutcome({ dataStore, user: new UserStub(), id: 'someOutcomeId' });
        expect(outcome).toBeInstanceOf(LearningOutcome);
      });
    });
  });

  describe('When updateLearningOutcome is called', () => {
    describe('and the user makes a valid request', () => {
      it('should return an updated instance of Learning Outcome', async () => {
        expect.assertions(1);
        const outcome = await LearningOutcomeInteractor.updateLearningOutcome(
          {
            dataStore,
            user: new UserStub(),
            id: 'someOutcomeId',
            updates: { verb: 'remember', bloom: 'remember and understand' }
          }
        );
        expect(outcome).toBeInstanceOf(LearningOutcome);
      });
    });
  });
});

describe('When deleteLearningObject is called', () => {
  describe('and the user makes a valid request', () => {
    it('should return a promise that resolves', async () => {
      expect.assertions(1);
      const promise = LearningOutcomeInteractor.deleteLearningOutcome(
        {
          dataStore,
          user: new UserStub(),
          id: 'someObjectId',
        },
      );
      expect(promise).resolves.toBeDefined();
    });
  });
});

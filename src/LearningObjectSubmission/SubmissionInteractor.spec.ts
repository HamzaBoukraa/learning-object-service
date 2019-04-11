import { submitForReview, cancelSubmission } from './SubmissionInteractor';
import {
  MOCK_OBJECTS,
  SUBMITTABLE_LEARNING_OBJECT,
} from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { FileManager } from '../interfaces/interfaces';
import { MockS3Driver } from '../tests/mock-drivers/MockS3Driver';

const dataStore: DataStore = new MockDataStore(); // DataStore
const fileManager: FileManager = new MockS3Driver();

describe('submitForReview', () => {
  it('should submit given a valid username and id', async () => {
    try {
      expect(
        await submitForReview({
          dataStore,
          fileManager,
          user: MOCK_OBJECTS.USERTOKEN,
          learningObjectId: SUBMITTABLE_LEARNING_OBJECT.id,
          userId: MOCK_OBJECTS.USER_ID,
          collection: SUBMITTABLE_LEARNING_OBJECT.collection,
        }),
      ).resolves.toBe(undefined);
    } catch (error) {
      console.log(error);
    }
  });
  describe('Learning Object validation errors', () => {
    it('should return an error when a learning object without a name is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview({
          dataStore,
          fileManager,
          user: MOCK_OBJECTS.USERTOKEN,
          learningObjectId: SUBMITTABLE_LEARNING_OBJECT.id,
          userId: MOCK_OBJECTS.USER_ID,
          collection: SUBMITTABLE_LEARNING_OBJECT.collection,
        });
      } catch (e) {
        expect(e instanceof Error).toBeTruthy();
        done();
      }
    });
    it('should return an error when a learning object without outcomes is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview({
          dataStore,
          fileManager,
          user: MOCK_OBJECTS.USERTOKEN,
          learningObjectId: SUBMITTABLE_LEARNING_OBJECT.id,
          userId: MOCK_OBJECTS.USER_ID,
          collection: SUBMITTABLE_LEARNING_OBJECT.collection,
        });
      } catch (e) {
        expect(e instanceof Error).toBeTruthy();
        done();
      }
    });
    it('should return an error when a learning object without a description is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview({
          dataStore,
          fileManager,
          user: MOCK_OBJECTS.USERTOKEN,
          learningObjectId: SUBMITTABLE_LEARNING_OBJECT.id,
          userId: MOCK_OBJECTS.USER_ID,
          collection: SUBMITTABLE_LEARNING_OBJECT.collection,
        });
      } catch (e) {
        expect(e instanceof Error).toBeTruthy();
        done();
      }
    });
  });
});

describe('cancelSubmission', () => {
  it('should cancel the submission given a valid username and id', async done => {
    try {
      await expect(
        cancelSubmission({
          dataStore,
          userId: MOCK_OBJECTS.USER_ID,
          emailVerified: true,
          learningObjectId: SUBMITTABLE_LEARNING_OBJECT.id,
        }),
      ).resolves.toBe(undefined);
      done();
    } catch (error) {
      console.log(error);
    }
  });
});



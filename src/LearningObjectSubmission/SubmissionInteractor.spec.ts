import { submitForReview, cancelSubmission } from './SubmissionInteractor';
import {
  MOCK_OBJECTS,
  SUBMITTABLE_LEARNING_OBJECT,
  INVALID_LEARNING_OBJECTS,
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
          username: MOCK_OBJECTS.USERNAME,
          id: SUBMITTABLE_LEARNING_OBJECT.id,
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
          username: MOCK_OBJECTS.USERNAME,
          id: INVALID_LEARNING_OBJECTS.NO_NAME.id,
          collection: MOCK_OBJECTS.COLLECTION_NAME,
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
          username: MOCK_OBJECTS.USERNAME,
          id: MOCK_OBJECTS.LEARNING_OBJECT.id,
          collection: MOCK_OBJECTS.COLLECTION_NAME,
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
          username: MOCK_OBJECTS.USERNAME,
          id: INVALID_LEARNING_OBJECTS.NO_DESCRIPTION.id,
          collection: MOCK_OBJECTS.COLLECTION_NAME,
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
        cancelSubmission(dataStore, SUBMITTABLE_LEARNING_OBJECT.id),
      ).resolves.toBe(undefined);
      done();
    } catch (error) {
      console.log(error);
    }
  });
});

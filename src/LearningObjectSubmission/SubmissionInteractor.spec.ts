
import { submitForReview, cancelSubmission } from './SubmissionInteractor';
import { MOCK_OBJECTS, SUBMITTABLE_LEARNING_OBJECT, INVALID_LEARNING_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

const dataStore: DataStore = new MockDataStore; // DataStore

describe('submitForReview', () => {
  it('should submit given a valid username and id', async () => {
    try {
      expect(await submitForReview(
        dataStore,
        MOCK_OBJECTS.USERNAME,
        SUBMITTABLE_LEARNING_OBJECT.id,
        SUBMITTABLE_LEARNING_OBJECT.collection,
      ))
      .resolves.toBe(undefined);
    } catch (error) {
      console.log(error);
    }
  });
  describe('Learning Object validation errors', () => {
    it('should return an error when a learning object without a name is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview(dataStore, MOCK_OBJECTS.USERNAME, INVALID_LEARNING_OBJECTS.NO_NAME.id, MOCK_OBJECTS.COLLECTION_NAME);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
    it('should return an error when a learning object without outcomes is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview(dataStore, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT.id, MOCK_OBJECTS.COLLECTION_NAME);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
    it('should return an error when a learning object without a description is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview(dataStore, MOCK_OBJECTS.USERNAME, INVALID_LEARNING_OBJECTS.NO_DESCRIPTION.id, MOCK_OBJECTS.COLLECTION_NAME);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
  });
});

describe('cancelSubmission', () => {
  it('should cancel the submission given a valid username and id', async done => {
    try {
      await expect(cancelSubmission(
        dataStore,
        SUBMITTABLE_LEARNING_OBJECT.id,
      ))
      .resolves.toBe(undefined);
      done();
    } catch (error) {
      console.log(error);
    }
  });
});

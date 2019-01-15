
import { submitForReview, cancelSubmission, createChangelog } from './SubmissionInteractor';
import { MOCK_OBJECTS, SUBMITTABLE_LEARNING_OBJECT, INVALID_LEARNING_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

const dataStore: DataStore = new MockDataStore; // DataStore

describe('submitForReview', () => {
  it('should submit given a valid username and id', async done => {
    try {
      await expect(submitForReview(
        dataStore,
        MOCK_OBJECTS.USERNAME,
        SUBMITTABLE_LEARNING_OBJECT.id,
      ))
      .resolves.toBe(undefined);
      done();
    } catch (error) {
      console.log(error);
    }
  });
  describe('Learning Object validation errors', () => {
    it('should return an error when a learning object without a name is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview(dataStore, MOCK_OBJECTS.USERNAME, INVALID_LEARNING_OBJECTS.NO_NAME.id);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
    it('should return an error when a learning object without outcomes is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview(dataStore, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT.id);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
    it('should return an error when a learning object without a description is provided', async done => {
      expect.assertions(1);
      try {
        await submitForReview(dataStore, MOCK_OBJECTS.USERNAME, INVALID_LEARNING_OBJECTS.NO_DESCRIPTION.id);
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
        MOCK_OBJECTS.USERNAME,
        SUBMITTABLE_LEARNING_OBJECT.id,
      ))
      .resolves.toBe(undefined);
      done();
    } catch (error) {
      console.log(error);
    }
  });
});

describe('createChangelog', () => {
  it('should create a new changelog', async done => {
    try {
      await expect(createChangelog(
        dataStore,
        MOCK_OBJECTS.LEARNING_OBJECT_ID,
        MOCK_OBJECTS.USER_ID,
        MOCK_OBJECTS.CHANGELOG_TEXT
      ))
      .resolves.toBe(undefined);
      done();
    } catch (error) {
      console.error(error);
    }
  });
})

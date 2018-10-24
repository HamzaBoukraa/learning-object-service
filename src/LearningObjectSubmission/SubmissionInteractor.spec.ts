
import { togglePublished } from './SubmissionInteractor';
import { MOCK_OBJECTS, SUBMITTABLE_LEARNING_OBJECT, INVALID_LEARNING_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

const dataStore: DataStore = new MockDataStore; // DataStore

describe('togglePublished', () => {
  it('should publish when given a valid username and id', async done => {
    try {
      await expect(togglePublished(
        dataStore,
        MOCK_OBJECTS.USERNAME,
        SUBMITTABLE_LEARNING_OBJECT.id,
        true,
      ))
      .resolves.toBe(undefined);
      done();
    } catch (error) {
      console.log(error);
    }
  });
  it('should unpublish when given a valid username and id', async done => {
    try {
      await expect(togglePublished(
        dataStore,
        MOCK_OBJECTS.USERNAME,
        SUBMITTABLE_LEARNING_OBJECT.id,
        false,
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
        await togglePublished(dataStore, MOCK_OBJECTS.USERNAME, INVALID_LEARNING_OBJECTS.NO_NAME.id, true);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
    it('should return an error when a learning object without outcomes is provided', async done => {
      expect.assertions(1);
      try {
        await togglePublished(dataStore, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT.id, true);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
    it('should return an error when a learning object without a description is provided', async done => {
      expect.assertions(1);
      try {
        await togglePublished(dataStore, MOCK_OBJECTS.USERNAME, INVALID_LEARNING_OBJECTS.NO_DESCRIPTION.id, true);
      } catch (e) {
        expect(typeof e).toEqual('string');
        done();
      }
    });
  });
});

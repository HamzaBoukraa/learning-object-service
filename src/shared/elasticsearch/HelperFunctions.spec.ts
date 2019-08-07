import { LearningObject, User } from '../../shared/entity';
import { cleanLearningObject } from '.';
import { Stubs } from '../../tests/stubs';
import { formatUpdateQueryParam } from './HelperFunctions';

const stubs = new Stubs();

/**
 * These tests describe the essential pieces of a Learning Object that we expect are
 * sent for indexing each time that a Learning Object is released. Additionally, they
 * ensure two properties are not indexed:
 * 1.) A Learning Object's metrics, since this data will be constantly changing.
 * 2.) The children, since these will be indexed on their own
 */
describe('cleanLearningObject', () => {
  describe('when a Learning Object is sent for indexing', () => {
    const l = new LearningObject({
      ...stubs.learningObject,
      author: new User(stubs.user),
    } as Partial<LearningObject>);
    it('should contain the name property', () => {
      expect(cleanLearningObject(stubs.learningObject).name).toBe(stubs.learningObject.name);
    });
    it('should contain the description property', () => {
      expect(cleanLearningObject(stubs.learningObject).description).toBe(stubs.learningObject.description);
    });
    it('should contain the date property', () => {
      expect(cleanLearningObject(stubs.learningObject).date).toBe(stubs.learningObject.date);
    });
    it('should contain the length property', () => {
      expect(cleanLearningObject(stubs.learningObject).length).toBe(stubs.learningObject.length);
    });
    it('should not contain the metrics property', () => {
      expect(cleanLearningObject(stubs.learningObject).metrics).toBeUndefined();
    });
    it('should not contain the children property', () => {
      expect(cleanLearningObject(stubs.learningObject).children).toBeUndefined();
    });
    it('should not contain the materials property', () => {
      expect(cleanLearningObject(stubs.learningObject).materials).toBeUndefined();
    });
    describe('the author object', () => {
      it('should contain the author\'s username', () => {
        expect(cleanLearningObject(stubs.learningObject).author.username).toBe(stubs.learningObject.author.username);
      });
      it('should contain the author\'s name', () => {
        expect(cleanLearningObject(stubs.learningObject).author.name).toBe(stubs.learningObject.author.name);
      });
      it('should contain the author\'s email', () => {
        expect(cleanLearningObject(stubs.learningObject).author.email).toBe(stubs.learningObject.author.email);
      });
      it('should contain the author\'s organization', () => {
        expect(cleanLearningObject(stubs.learningObject).author.organization).toBe(stubs.learningObject.author.organization);
      });
    });
  });
});

describe('formatUpdateQueryParam', () => {
  describe('when the function receives an object without nested objects', () => {
    it('should return a string with only root level parameters', () => {
      const query = {
        name: 'test',
        level: 2,
      };
      // tslint:disable-next-line:quotemark
      const formattedString = "ctx._source.name = \"test\";ctx._source.level = \"2\";";
      expect(formatUpdateQueryParam(query)).toBe(formattedString);
    });
  });
  describe('when the function receives an object with nested objects', () => {
    it('should return a string with all parameters in correct depths', () => {
      const query = {
        name: 'test',
        level: 2,
        object: {
          name: 'test',
          level: 2,
        },
      };
      // tslint:disable-next-line:quotemark
      const formattedString = "ctx._source.name = \"test\";ctx._source.level = \"2\";ctx._source.object.name = \"test\";ctx._source.object.level = \"2\";";
      expect(formatUpdateQueryParam(query)).toBe(formattedString);
    });
  });
  describe('when the function receives an object with a nested array of objects', () => {
    it('should return a string with all parameters in correct depths', () => {
      const query = {
        name: 'test',
        level: 2,
        object: [
          {
            name: 'test',
            level: 2,
          },
          {
            name: 'test 2',
            level: 3,
          },
        ],
      };
      // tslint:disable-next-line
      const formattedString = "ctx._source.name = \"test\";ctx._source.level = \"2\";ctx._source.object[0].name = \"test\";ctx._source.object[0].level = \"2\";ctx._source.object[1].name = \"test 2\";ctx._source.object[1].level = \"3\";"
      expect(formatUpdateQueryParam(query)).toBe(formattedString);
    });
  });
  describe('when the function receives an empty object', () => {
    it('should return an empty string', () => {
      const query = {};
      // tslint:disable-next-line
      const formattedString = "";
      expect(formatUpdateQueryParam(query)).toBe(formattedString);
    });
  });
  describe('when the function receives an object with an array of strings', () => {
    it('should return an empty string', () => {
      const query = {
        strings: ['unit', 'test'],
      };
      // tslint:disable-next-line
      const formattedString =  "ctx._source.strings.0 = \"unit\";ctx._source.strings.1 = \"test\";";
      expect(formatUpdateQueryParam(query)).toBe(formattedString);
    });
  });
});

import { LearningObject, User } from '../../entity';
import { generateLearningObjectSearchDocument } from './generateLearningObjectSearchDocument';
import { Stubs } from '../../../tests/stubs';

const stubs = new Stubs();

/**
 * These tests describe the essential pieces of a Learning Object that we expect are
 * sent for indexing each time that a Learning Object is released. Additionally, they
 * ensure two properties are not indexed:
 * 1.) A Learning Object's metrics, since this data will be constantly changing.
 * 2.) The children, since these will be indexed on their own
 */
describe('generateLearningObject', () => {
  describe('when a Learning Object is sent for indexing', () => {
    const l = new LearningObject({
      ...stubs.learningObject,
      author: new User(stubs.user),
    } as Partial<LearningObject>);
    it('should contain the name property', () => {
      expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).name).toBe(stubs.learningObject.name);
    });
    it('should contain the description property', () => {
      expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).description).toBe(stubs.learningObject.description);
    });
    it('should contain the date property', () => {
      expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).date).toBe(stubs.learningObject.date);
    });
    it('should contain the length property', () => {
      expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).length).toBe(stubs.learningObject.length);
    });
    describe('the author object', () => {
      it('should contain the author\'s username', () => {
        expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).author.username).toBe(stubs.learningObject.author.username);
      });
      it('should contain the author\'s name', () => {
        expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).author.name).toBe(stubs.learningObject.author.name);
      });
      it('should contain the author\'s email', () => {
        expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).author.email).toBe(stubs.learningObject.author.email);
      });
      it('should contain the author\'s organization', () => {
        expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).author.organization).toBe(stubs.learningObject.author.organization);
      });
    });
    describe('the fileTypes', () => {
      it('should contain videos', () => {
        expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).fileTypes).toContain('video');
      });
      it('should contain powerpoint', () => {
        expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).fileTypes).toContain('powerpoint');
      });
      it('should contain document', () => {
        expect(generateLearningObjectSearchDocument(stubs.learningObject, stubs.fileTypes).fileTypes).toContain('document');
      })
    });
  });
});

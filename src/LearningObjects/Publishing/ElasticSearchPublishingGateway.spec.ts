import { ElasticSearchPublishingGateway } from './ElasticSearchPublishingGateway';
import { MOCK_OBJECTS } from '../../tests/mocks';
import { LearningObject, User } from '../../shared/entity';

/**
 * These tests describe the essential pieces of a Learning Object that we expect are
 * sent for indexing each time that a Learning Object is released. Additionally, they
 * ensure two properties are not indexed:
 * 1.) A Learning Object's metrics, since this data will be constantly changing.
 * 2.) The children, since these will be indexed on their own
 */
describe('when a Learning Object is sent for indexing', () => {
  const publishingGateway = new ElasticSearchPublishingGateway();
  const l = new LearningObject({
    ...MOCK_OBJECTS.LEARNING_OBJECT,
    author: new User(MOCK_OBJECTS.AUTHOR_MOCK),
  } as Partial<LearningObject>);
  it('should contain the name property', () => {
    expect(publishingGateway.cleanDocument(l).name).toBe(MOCK_OBJECTS.LEARNING_OBJECT.name);
  });
  it('should contain the description property', () => {
    expect(publishingGateway.cleanDocument(l).description).toBe(MOCK_OBJECTS.LEARNING_OBJECT.description);
  });
  it('should contain the date property', () => {
    expect(publishingGateway.cleanDocument(l).date).toBe(MOCK_OBJECTS.LEARNING_OBJECT.date);
  });
  it('should contain the length property', () => {
    expect(publishingGateway.cleanDocument(l).length).toBe(MOCK_OBJECTS.LEARNING_OBJECT.length);
  });
  it('should not contain the metrics property', () => {
    expect(publishingGateway.cleanDocument(l).metrics).toBeUndefined();
  });
  it('should not contain the children property', () => {
    expect(publishingGateway.cleanDocument(l).children).toBeUndefined();
  });
  it('should not contain the materials property', () => {
    expect(publishingGateway.cleanDocument(l).materials).toBeUndefined();
  });
  describe('the author object', () => {
    it('should contain the author\'s username', () => {
      expect(publishingGateway.cleanDocument(l).author.username).toBe(MOCK_OBJECTS.AUTHOR_MOCK.username);
    });
    it('should contain the author\'s name', () => {
      expect(publishingGateway.cleanDocument(l).author.name).toBe(MOCK_OBJECTS.AUTHOR_MOCK.name);
    });
    it('should contain the author\'s email', () => {
      expect(publishingGateway.cleanDocument(l).author.email).toBe(MOCK_OBJECTS.AUTHOR_MOCK.email);
    });
    it('should contain the author\'s organization', () => {
      expect(publishingGateway.cleanDocument(l).author.organization).toBe(MOCK_OBJECTS.AUTHOR_MOCK.organization);
    });
  });
});

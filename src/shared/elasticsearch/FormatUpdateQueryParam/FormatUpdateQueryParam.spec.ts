import { formatUpdateQueryParam } from './FormatUpdateQueryParam';
import { LearningObjectSearchDocument } from '../types/LearningObjectSearchDocument';
import { LearningObject, LearningOutcome } from '../../entity';

const learningOutcomeStub = new LearningOutcome({
  id: 'outcome_id',
  bloom: 'remember and understand',
  verb: 'remember',
  text: 'outcome_text',
  mappings: [],
});

const learningObjectSearchDocumentStub: LearningObjectSearchDocument = {
  author: {
    name: 'author_name',
    username: 'author_username',
    email: 'author_email',
    organization: 'author_organization',
  },
  collection: 'collection',
  contributors: [
    {
      name: 'contributor_name',
      username: 'contributor_username',
      email: 'contributor_email',
      organization: 'contributor_organization',
    },
  ],
  date: 'date',
  description: 'description',
  cuid: '46e3d323-a731-4435-93a0-684c1ccfad34',
  id: 'id',
  length: 'length',
  levels: ['level'],
  name: 'name',
  outcomes: [learningOutcomeStub],
  version: 0,
  status: LearningObject.Status.UNRELEASED,
  fileTypes: ['video', 'powerpoint', 'document'],
};

describe('formatUpdateQueryParam', () => {
  describe('when the function receives a LearningObjectSearchDocument', () => {
    it('should return a string with all properties intact', () => {
      const formattedString =
        // tslint:disable-next-line:max-line-length
        `ctx._source.author.name = \"author_name\";ctx._source.author.username = \"author_username\";ctx._source.author.email = \"author_email\";ctx._source.author.organization = \"author_organization\";ctx._source.collection = \"collection\";ctx._source.contributors[0].name = \"contributor_name\";ctx._source.contributors[0].username = \"contributor_username\";ctx._source.contributors[0].email = \"contributor_email\";ctx._source.contributors[0].organization = \"contributor_organization\";ctx._source.date = \"date\";ctx._source.description = \"description\";ctx._source.cuid = \"46e3d323-a731-4435-93a0-684c1ccfad34\";ctx._source.id = \"id\";ctx._source.length = \"length\";ctx._source.levels.0 = \"level\";ctx._source.name = \"name\";ctx._source.outcomes[0]._id = \"outcome_id\";ctx._source.outcomes[0]._bloom = \"remember and understand\";ctx._source.outcomes[0]._verb = \"remember\";ctx._source.outcomes[0]._text = \"outcome_text\";ctx._source.outcomes[0]._mappings = \"\";ctx._source.version = \"0\";ctx._source.status = \"unreleased\";`;
      expect(formatUpdateQueryParam(learningObjectSearchDocumentStub)).toBe(
        formattedString,
      );
    });
  });
});

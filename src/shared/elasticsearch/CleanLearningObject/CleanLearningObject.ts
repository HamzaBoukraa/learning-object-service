import { LearningObject } from '../../entity';
import { LearningObjectSearchDocument } from '../types/LearningObjectSearchDocument';

/**
 * Prepares a Learning Object for indexing by removing unneeded data.
 *
 * @param learningObject A fully qualified Learning Object where all values
 * are loaded to their correct values (no foreign key IDs)
 */
export function cleanLearningObjectSearchDocument(
  learningObject: LearningObject,
): LearningObjectSearchDocument {
  const learningObjectSearchDocument = formatLearningObjectSearchDocument(
    learningObject,
  );
  return learningObjectSearchDocument;
}

function formatLearningObjectSearchDocument(
  learningObject: LearningObject,
): LearningObjectSearchDocument {
  const learningObjectSearchDocument = {
    author: {
      name: learningObject.author.name,
      username: learningObject.author.username,
      email: learningObject.author.email,
      organization: learningObject.author.organization,
    },
    collection: learningObject.collection,
    contributors: learningObject.contributors.map(c => ({
      name: c.name,
      username: c.username,
      email: c.email,
      organization: c.organization,
    })),
    date: learningObject.date,
    description: learningObject.description,
    cuid: learningObject.cuid,
    id: learningObject.id,
    length: learningObject.length,
    levels: learningObject.levels,
    name: learningObject.name,
    outcomes: learningObject.outcomes,
    version: learningObject.version,
    status: learningObject.status,
  };
  return learningObjectSearchDocument;
}

import { LearningObject } from '../entity';

/**
 * Prepares a Learning Object for indexing by removing unneeded data.
 *
 * @param learningObject A fully qualified Learning Object where all values
 * are loaded to their correct values (no foreign key IDs)
 */
export function cleanLearningObject(learningObject: LearningObject) {
  const doc = {
    ...learningObject.toPlainObject(),
    author: {
      name: learningObject.author.name,
      username: learningObject.author.username,
      email: learningObject.author.email,
      organization: learningObject.author.organization,
    },
    contributors: learningObject.contributors.map(c => ({
      name: c.name,
      username: c.username,
      email: c.email,
      organization: c.organization,
    })),
  };
  delete doc.children;
  delete doc.metrics;
  delete doc.materials;
  return doc;
}

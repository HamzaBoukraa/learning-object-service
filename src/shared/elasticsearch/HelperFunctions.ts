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

/**
 * formatUpdateQueryParam takes an object and formats
 * it into a string that is accepted by the Elasticsearch
 * updateByQuery function
 *
 * @param cleanObject
 */
export function formatUpdateQueryParam(
    cleanObject: {},
): string {
  let rootProperties = Object.keys(cleanObject);
  let formattedUpdateParam: string = '';
  rootProperties.map(property => {
    let rootValue = cleanObject[property];
    if (
      Array.isArray(cleanObject[property])
      && cleanObject[property][0]
      && typeof cleanObject[property][0] === 'object'
    ) {
      cleanObject[property].forEach((subObject: {}, index: number) => {
        let subProperties = Object.keys(subObject);
        subProperties.forEach(subProperty => {
          let subValue = cleanObject[property][index][subProperty];
          formattedUpdateParam = formattedUpdateParam.concat(`ctx._source.${property}[${index}].${subProperty} = \"${subValue}\";`);
        });
      });
    } else if (typeof cleanObject[property] === 'object') {
      let subProperties = Object.keys(cleanObject[property]);
      subProperties.forEach(subProperty => {
        let subValue = cleanObject[property][subProperty];
        formattedUpdateParam = formattedUpdateParam.concat(`ctx._source.${property}.${subProperty} = \"${subValue}\";`);
      });
    } else {
      formattedUpdateParam = formattedUpdateParam.concat(`ctx._source.${property} = \"${rootValue}\";`);
    }
  });
  return formattedUpdateParam;
}

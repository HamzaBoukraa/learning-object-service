import { LearningObjectSearchDocument } from '../types/LearningObjectSearchDocument';

/**
 * formatUpdateQueryParam takes an object and formats
 * it into a string that is accepted by the Elasticsearch
 * updateByQuery function
 *
 * 1. generate array of object properties
 * 2. iterate over the generated array
 * 3. determine which category the current property fits in
 * 4. Perform action based on category
 * 5. return formattedUpdateParam string
 *
 * @param cleanObject
 */
export function formatUpdateQueryParam(
    cleanObject: LearningObjectSearchDocument,
): string {
  let rootProperties = generateObjectPropertiesArray(cleanObject);
  let formattedUpdateParam: string = '';
  rootProperties.forEach(propertyName => {
    let propertyValue = cleanObject[propertyName];
    const property = propertyFactory(propertyValue);
    formattedUpdateParam.concat(property.format());
  });
  return formattedUpdateParam;
}

function propertyFactory<T>(cleanObjectProperty: T): Property {
  let property: Property;
  if (isArrayOfObjects(cleanObjectProperty)) {
    property = new ObjectArrayProperty();
  } else if (isObject(cleanObjectProperty)) {
    property = new ObjectProperty();
  } else {
    property = new GeneralProperty();
  }

  return property;
}

function isArrayOfObjects<T>(cleanObjectProperty: T): boolean {
  return (
    Array.isArray(cleanObjectProperty)
    && cleanObjectProperty[0]
    && typeof cleanObjectProperty[0] === 'object'
  );
}

function isObject<T>(cleanObjectProperty: T): boolean {
  return typeof cleanObjectProperty === 'object';
}

interface Property {
  format<T>(cleanObjectProperty: T): string;
}

class ObjectArrayProperty implements Property {

  format<Array>(cleanObjectProperty: Array<T>): string {
    let formattedUpdateParam = '';
    cleanObjectProperty.forEach((subObject: {}, index: number) => {
      let subProperties = generateObjectPropertiesArray(subObject);
      subProperties.forEach(subProperty => {
        let subValue = cleanObjectProperty[index][subProperty];
        formattedUpdateParam = formattedUpdateParam.concat(`ctx._source.${property}[${index}].${subProperty} = \"${subValue}\";`);
      });
    });
    return formattedUpdateParam;
  }
}

class ObjectProperty implements Property {

  format(cleanObjectProperty: Object): string {
    let formattedUpdateParam = '';
    let subProperties = generateObjectPropertiesArray(cleanObjectProperty);
    subProperties.forEach(subProperty => {
      let subValue = cleanObjectProperty[subProperty];
      formattedUpdateParam = formattedUpdateParam.concat(`ctx._source.${property}.${subProperty} = \"${subValue}\";`);
    });
    return formattedUpdateParam;
  }
}

class GeneralProperty implements Property {
   format(): string {
      return `ctx._source.${property} = \"${rootValue}\";`;
   }
}

function generateObjectPropertiesArray<T>(cleanObject: T): string[] {
  return Object.keys(cleanObject);
}

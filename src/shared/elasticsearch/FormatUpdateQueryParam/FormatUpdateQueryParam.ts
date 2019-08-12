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
    let propertyValue = getPropertyValue({
      learningObjectSearchDocument: cleanObject,
      propertyName,
    });
    const property = propertyFactory(propertyValue);
    const formattedProperty = property.format({
      propertyName,
      propertyValue,
    });
    formattedUpdateParam = formattedUpdateParam.concat(formattedProperty);
  });
  return formattedUpdateParam;
}

function getPropertyValue(params: {
  learningObjectSearchDocument: LearningObjectSearchDocument;
  propertyName: string
}): any {
  return params.learningObjectSearchDocument[params.propertyName];
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
  format( params: {
    propertyName: string,
    propertyValue: any,
  }): string;
}

class ObjectArrayProperty implements Property {

  format(params: {
    propertyName: string;
    propertyValue: Object[];
  }): string {
    let formattedUpdateParam = '';
    params.propertyValue.forEach((subObject: {}, index: number) => {
      let subProperties = generateObjectPropertiesArray(subObject);
      subProperties.forEach(subProperty => {
        let subValue = params.propertyValue[index][subProperty];
        formattedUpdateParam = formattedUpdateParam.concat(`ctx._source.${params.propertyName}[${index}].${subProperty} = \"${subValue}\";`);
      });
    });
    return formattedUpdateParam;
  }
}

class ObjectProperty implements Property {

  format(params: {
    propertyName: string;
    propertyValue: {};
  }): string {
    let formattedUpdateParam = '';
    let subProperties = generateObjectPropertiesArray(params.propertyValue);
    subProperties.forEach(subProperty => {
      let subValue = params.propertyValue[subProperty];
      formattedUpdateParam = formattedUpdateParam.concat(`ctx._source.${params.propertyName}.${subProperty} = \"${subValue}\";`);
    });
    return formattedUpdateParam;
  }
}

class GeneralProperty implements Property {
   format(params: {
     propertyName: string;
     propertyValue: any;
   }): string {
      return `ctx._source.${params.propertyName} = \"${params.propertyValue}\";`;
   }
}

function generateObjectPropertiesArray<T>(cleanObject: T): string[] {
  return Object.keys(cleanObject);
}

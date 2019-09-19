import { ResourceError, ResourceErrorReason } from '../../../../shared/errors';

/**
 * Validates parameters using passed validators. If validator returns false, errors are generated.
 *
 * @param {string} operation [The operation being performed. Used to generate error message.]
 * @param {{ value: any; validator: any; propertyName: string }} values [The values to validate]
 * @returns {(void | never)}
 */
export function validateRequestParams({
  operation,
  values,
}: {
  operation: string;
  values: { value: any; validator: any; propertyName: string }[];
}): void | never {
  let hasErrors = false;
  let errMsg = `Cannot ${operation}.`;
  values.forEach(val => {
    if (!val.validator(val.value)) {
      hasErrors = true;
      errMsg += ` ${val.value} is not a valid value for ${val.propertyName}.`;
    }
  });
  if (hasErrors) {
    throw new ResourceError(errMsg, ResourceErrorReason.BAD_REQUEST);
  }
}

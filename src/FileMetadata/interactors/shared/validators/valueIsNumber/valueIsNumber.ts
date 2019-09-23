import { valueDefined } from '../valueDefined/valueDefined';

/**
 * Checks if value is a number
 *
 * @export
 * @param {number} val [The value to be validated]
 * @returns {boolean}
 */
export function valueIsNumber(val: number): boolean {
  return valueDefined(val) && !isNaN(+val);
}

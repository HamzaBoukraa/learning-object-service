/**
 * Checks if string value contains characters and is not a string of empty spaces
 *
 * @export
 * @param {string} val [The value to be validated]
 * @returns {boolean}
 */
export function stringHasContent(val: string): boolean {
  if (val == null) {
    return false;
  }
  val = val.trim();
  if (!val || val === 'null' || val === 'undefined') {
    return false;
  }
  return true;
}

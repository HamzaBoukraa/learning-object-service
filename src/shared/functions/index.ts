/**
 * Formats text properly for usage in DataStore
 *
 * @export
 * @param {string} text
 * @param {boolean} [lowerCase=true]
 * @returns {string}
 */
export function sanitizeText(text: string, lowerCase = true): string {
  let clean = text;
  if (clean) {
    if (lowerCase) {
      clean = clean.toLowerCase();
    }
    clean.trim();
  }

  return clean;
}

/**
 * Sanitizes Object by removing undefined values and lower-casing strings;
 *
 * @export
 * @param {T} object
 * @returns {T}
 */
export function sanitizeObject<T>(
  params: { object: T },
  lowercaseStrings = true,
): T {
  const keys = Object.keys(params.object);
  for (const key of keys) {
    const field = params.object[key];
    if (!field || field == null || field === 'undefined' || field === 'null') {
      delete params.object[key];
    } else if (field && typeof field === 'string') {
      params.object[key] = sanitizeText(field, lowercaseStrings);
    }
  }
  return params.object;
}

/**
 * Returns new array with element(s) from value param or null if value was not defined
 *
 * @template T
 * @param {*} value
 * @returns {T[]}
 */
export function toArray<T>(value: any): T[] {
  if (value == null || value === '') {
    return null;
  }
  if (value && Array.isArray(value)) {
    return [...value].filter(v => !isEmptyValue(v));
  }
  return [value].filter(v => !isEmptyValue(v));
}

/**
 * Checks if provided value is null or an empty string
 *
 * @param {*} value [The value being checked]
 * @returns {boolean}
 */
function isEmptyValue(value: any): boolean {
  if (value == null || value === '') {
    return true;
  }
  if (typeof value === 'string') {
    return sanitizeText(value) === '';
  }
  return false;
}

/**
 *
 * Converts non-number value to number if defined else returns null
 * @param {*} value
 * @returns {number}
 */
export function toNumber(value: any): number {
  const num = parseInt(`${value}`, 10);
  if (!isNaN(num)) {
    return num;
  }
  return null;
}

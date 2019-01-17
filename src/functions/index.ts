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
    if (
      !field ||
      field === undefined ||
      field === 'undefined' ||
      field === null ||
      field === 'null'
    ) {
      delete params.object[key];
    } else if (field && typeof field === 'string') {
      params.object[key] = sanitizeText(field, lowercaseStrings);
    }
  }
  return params.object;
}

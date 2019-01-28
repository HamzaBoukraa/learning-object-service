/**
 * Returns Bearer token from authorization header.
 *
 * @export
 * @param {string} authHeader
 * @returns {string}
 */
export function getBearerToken(authHeader: string): string {
  let token;
  const [type, tokenVal] = authHeader ? authHeader.split(' ') : [null, null];
  if (
    type === 'Bearer' &&
    tokenVal &&
    tokenVal !== 'null' &&
    tokenVal !== 'undefined'
  ) {
    token = tokenVal;
  }
  return token;
}

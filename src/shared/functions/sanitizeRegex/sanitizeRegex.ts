/**
 * Escapes Regex quantifier, alternation, single sequence anchor, new line, and parenthesis characters in a string
 *
 * @export
 * @param {string} text
 * @returns {string}
 */
export function sanitizeRegex(text: string): string {
    const regexChars = /\.|\+|\*|\^|\$|\?|\[|\]|\(|\)|\|/;
    if (regexChars.test(text)) {
      let newString = '';
      const chars = text.split('');
      for (const c of chars) {
        const isSpecial = regexChars.test(c.trim());
        if (isSpecial) {
          newString += `\\${c}`;
        } else {
          newString += c;
        }
      }
      text = newString;
    }
    return text;
}
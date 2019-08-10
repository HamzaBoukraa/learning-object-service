/**
 * Ensures page is not less than 1 if defined
 *
 * @private
 * @param {number} page
 * @returns
 * @memberof MongoDriver
 */
export function validatePageNumber(page: number) {
    if (page != null && page <= 0) {
        return 1;
    }
    return page;
}

/**
 * Calculated number of docs to skip based on page and limit
 *
 * @private
 * @param {{ page: number; limit: number }} params
 * @returns
 * @memberof MongoDriver
 */
export function calculateDocumentsToSkip(params: {
    page: number;
    limit: number;
}): number {
    return params.page && params.limit ? (params.page - 1) * params.limit : 0;
}

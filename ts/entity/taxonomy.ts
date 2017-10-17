/**
 * Provide taxonomical structures relating Bloom categories and
 * associated word selections for learning outcome verbs, assessment
 * plans, and instructional strategies.
 */

import { readFileSync } from 'jsonfile';
const file = 'taxonomy.json';
let taxonomy = readFileSync(file);

/**
 * All permitted learning object classes, ie. their length category.
 */
export const lengths = new Set<string>(taxonomy.lengths);

/**
 * All permitted Bloom taxons.
 */
export const levels = new Set<string>(Object.keys(taxonomy.taxons));

/**
 * All permitted learning outcomes for each Bloom taxon.
 */
export const verbs = buildTaxonomy('verbs');

/**
 * All permitted assessment plans for each Bloom taxon.
 */
export const assessments = buildTaxonomy('assessments');

/**
 * All permitted test/quiz sub-classes for each Bloom taxon.
 */
export const quizzes = buildTaxonomy('quizzes');

/**
 * All permitted instructional strategies for each Bloom taxon.
 */
export const instructions = buildTaxonomy('strategies');


/**
 * Define the shape of the taxonomical structures we will export.
 */
type taxonomy = {[level:string]: Set<string>}

/**
 * Build a taxonomy object from the taxonomy.json file.
 * @param {string} which the field to pull from the taxon
 * 
 * @returns {taxonomy}
 */
function buildTaxonomy(which: string): taxonomy {
    let c: taxonomy = {};
    for ( let level of levels ) {
        c[level] = new Set<string>(taxonomy.taxons[level][which]);
    }
    return c;
}

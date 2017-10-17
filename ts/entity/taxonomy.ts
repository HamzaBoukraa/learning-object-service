/**
 * Provide taxonomical structures relating Bloom categories and
 * associated word selections for learning outcome verbs, assessment
 * plans, and instructional strategies.
 * 
 * NOTE: except for 'levels', all words are lower-cased. Style
 *       alterations may be necessary when using the words in UI.
 */

/* TODO: probably appropriate to move taxonomy info to a JSON file, and
         have this file just pull and export it. */

 /**
  * All permitted learning object classes, ie. their length category.
  */
export const lengths = new Set<string>([
    "nanomodule",
    "micromodule",
    "module",
    "unit",
    "course",
]);

/**
 * All permitted Bloom taxons.
 * 
 * NOTE: Bloom had six taxons, but we are presently
 *       grouping them in pairs.
 */
export const levels = new Set<string>([
    'Remember and Understand',
    'Apply and Analyze',
    'Evaluate and Synthesize'
]);

// define the shape of the taxonomical structures we will export
type taxonomy = {[level:string]: Set<string>}

/* TODO: fill these hashes with all the needed values
         (or preferably fill a JSON file) */

/**
 * All permitted learning outcomes for each Bloom taxon.
 */
export const verbs: taxonomy = {
    'Remember and Understand': new Set<string>(['define','repeat','record','list','describe','explain','identify','recognize']),
    'Apply and Analyze': new Set<string>(['interpret','apply','employ','demonstrate','criticize','analyze','inspect']),
    'Evaluate and Synthesize': new Set<string>(['compose','plan','propose','manage','evaluate','appraise'])
};

/**
 * All permitted assessment plans for each Bloom taxon.
 */
export const assessments: taxonomy = {
    'Remember and Understand': new Set<string>(['essay','research paper','presentation','quiz/test','lab']),
    'Apply and Analyze': new Set<string>(['essay','research paper','presentation','lab','case study']),
    'Evaluate and Synthesize': new Set<string>(['essay','research paper','presentation','lab','case study'])
};

/**
 * All permitted instructional strategies for each Bloom taxon.
 */
export const instructions: taxonomy = {
    'Remember and Understand': new Set<string>(['lecture','visuals','videos']),
    'Apply and Analyze': new Set<string>(['exercises','practice','demonstrations','problems']),
    'Evaluate and Synthesize': new Set<string>(['projects','problems','case studies','simulations'])
};

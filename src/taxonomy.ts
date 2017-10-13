export const lengths = new Set<string>([
    "nanomodule",
    "micromodule",
    "module",
    "unit",
    "course",
]);

export const levels = new Set<string>([
    'Remember and Understand',
    'Apply and Analyze',
    'Evaluate and Synthesize'
]);

// TODO: It would be nice for the keys in the below hashes to
//  be tied directly to the elements of 'levels' above.
//  But the intuitive syntax to do so could not compile.

// TODO: fill these hashes with all the needed values

type taxonomy = {[level:string]: Set<string>}

export const verbs: taxonomy = {
    'Remember and Understand': new Set<string>(['define','repeat','record','list','describe','explain','identify','recognize']),
    'Apply and Analyze': new Set<string>(['interpret','apply','employ','demonstrate','criticize','analyze','inspect']),
    'Evaluate and Synthesize': new Set<string>(['compose','plan','propose','manage','evaluate','appraise'])
};

export const assessments: taxonomy = {
    'Remember and Understand': new Set<string>(['essay','research paper','presentation','quiz/test','lab']),
    'Apply and Analyze': new Set<string>(['essay','research paper','presentation','lab','case study']),
    'Evaluate and Synthesize': new Set<string>(['essay','research paper','presentation','lab','case study'])
};

export const instructions: taxonomy = {
    'Remember and Understand': new Set<string>(['lecture','visuals','videos']),
    'Apply and Analyze': new Set<string>(['exercises','practice','demonstrations','problems']),
    'Evaluate and Synthesize': new Set<string>(['projects','problems','case studies','simulations'])
};

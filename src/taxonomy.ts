export const lengths = new Set<string>([
    "course",
    "unit",
    "module",
    "micromodule",
    "nanomodule"
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
    'Remember and Understand': new Set<string>(['define','repeat','record']),
    'Apply and Analyze': new Set<string>(['interpret','apply','employ']),
    'Evaluate and Synthesize': new Set<string>(['compose','plan','propose'])
};

export const assessments: taxonomy = {
    'Remember and Understand': new Set<string>(['essay','research paper','presentation']),
    'Apply and Analyze': new Set<string>(['essay','research paper','presentation']),
    'Evaluate and Synthesize': new Set<string>(['essay','research paper','presentation'])
};

export const instructions: taxonomy = {
    'Remember and Understand': new Set<string>(['lectures','visuals','videos']),
    'Apply and Analyze': new Set<string>(['exercises','practice','demonstrations']),
    'Evaluate and Synthesize': new Set<string>(['projects','problems','case studies'])
};

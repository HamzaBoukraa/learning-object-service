export const depths = [
    "course",
    "unit",
    "module",
    "micromodule",
    "nanomodule"
];

export const levels = [
    'Remember and Understand',
    'Apply and Analyze',
    'Evaluate and Synthesize'
];

// TODO: It would be nice for the keys in the below hashes to
//  be tied directly to the elements of 'levels' above.
//  But the intuitive syntax to do so could not compile.

// TODO: fill these hashes with all the needed values

export const verbs = {
    'Remember and Understand': ['define','repeat','record'],
    'Apply and Analyze': ['interpret','apply','employ'],
    'Evaluate and Synthesize': ['compose','plan','propose']
};

export const assessments = {
    'Remember and Understand': ['essay','research paper','presentation'],
    'Apply and Analyze': ['essay','research paper','presentation'],
    'Evaluate and Synthesize': ['essay','research paper','presentation']
};

export const instructions = {
    'Remember and Understand': ['lectures','visuals','videos'],
    'Apply and Analyze': ['exercises','practice','demonstrations'],
    'Evaluate and Synthesize': ['projects','problems','case studies']
};

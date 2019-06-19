export function formatResponse(learningObject) {
    return {
        ...learningObject, 
        author: {
            ...learningObject.author, 
            createdAt: null
        },
        contributors: learningObject.contributors
            .map(contributor => formatContributors(contributor)),
    };
}

function formatContributors(contributor) {
    return {...contributor, createdAt: null};
}
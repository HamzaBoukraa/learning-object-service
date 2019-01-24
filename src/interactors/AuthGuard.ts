import { LearningObjectError } from "../errors";

// TODO export from new entity after new builder merge
export enum accessGroups {
  ADMIN = 'admin',
  EDITOR = 'editor',
  CURATOR = 'curator',
  REVIEWER = 'reviewer',
  USER = 'user'
}

export function verifyAccessGroup(userAccessGroups: string[], requiredAccessGroups: string[]) {
   
    let hasAccess = false;
    userAccessGroups.forEach(userGroup => {
        if (requiredAccessGroups.indexOf(userGroup) > -1 ) {
            hasAccess = true;
        }
    })

    if (!hasAccess) {
        throw new Error(LearningObjectError.INVALID_ACCESS(userAccessGroups, requiredAccessGroups));
    }
}


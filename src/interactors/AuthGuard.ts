import { LearningObjectError } from '../errors';
import { accessGroups } from '../types/user-token';

// TODO export from new entity after new builder merge
export enum accessGroupsComparison {
  ADMIN,
  EDITOR,
  CURATOR,
  REVIEWER,
  USER
}

/**
 * Compares two string arrays and checks for a matching pair
 * If a matching pair exists, access to the requested function is granted
 * Else, an error is thrown
 * 
 * Curator and Reviewer strings are structured differently (i.e. curator@abvCollectionName). Because of this,
 * they require a special case
 * 
 * If canBeUser, a signed in user can perform the action. Return true so that the caller can handle the case of a user 
 * without throwing an error
 *
 * @param {string[]} userAccessGroups the access groups that belong to the current user
 * @param {string[]} requiredAccessGroups the access groups that required for the needed function
 *
 * @returns {void | Error} Throws an error if the current user does not have permission to access the needed function
 */
export function verifyAccessGroup(
    userAccessGroups: string[],
    requiredAccessGroups: string[],
    requestedCollection?: string,
    canBeUser?: boolean
): boolean {

    let hasAccess = false;

    // Sort both arrays so that higher access groups appear first
    const sortedUserAccessGroups = mergeSort(userAccessGroups);
    const sortedRequiredAccessGroups = mergeSort(requiredAccessGroups);
    
    for (let userGroup of sortedUserAccessGroups) {
        if (userGroup.includes(accessGroups.REVIEWER)) {
            if(sortedRequiredAccessGroups.indexOf(accessGroups.REVIEWER) > -1) {
                if(requestedCollection) {
                    hasAccess = verifyCollectionAccess(userGroup, requestedCollection);
                    if (hasAccess) {
                        break;
                    }
                } else {
                    hasAccess = true
                    break;
                }
            }
        } else if (userGroup.includes(accessGroups.CURATOR)) {
            if(sortedRequiredAccessGroups.indexOf(accessGroups.CURATOR) > -1) {
                if(requestedCollection) {
                    hasAccess = verifyCollectionAccess(userGroup, requestedCollection);
                    if (hasAccess) {
                        break;
                    }
                } else {
                    hasAccess = true
                    break;
                }
            }
        } else {
            if (requiredAccessGroups.indexOf(userGroup) > -1) {
                hasAccess = true;
                break;
            }
        }
    }

    return canBeUser || hasAccess;
}

/**
 * Recursive implementation of merge sort algorithm. We use this function to sort accessGroup arrays
 * by level of access. Higher access groups should come first in the array (i.e. ['editor', 'admin'] -> ['admin', 'editor'])
 *
 * @param {string[]} accessGroups array of access groups to be sorted
 *
 * @returns {string[]} sorted array of access groups
 */
function mergeSort(accessGroups: string[]): string[] {
    if (accessGroups.length  === 1) {
        return accessGroups;
    }

    const center = Math.floor(accessGroups.length / 2);
    const left = accessGroups.slice(0, center);
    const right = accessGroups.slice(center);

    return merge(mergeSort(left), mergeSort(right));
}


/**
 * Responsible for merging the left and right arrays that are generated in the mergeSort function
 * 
 * @param {string[]} left array containing elements 0 to center from accessGroups array
 * @param {string[]} right array containing elements center + 1 to length - 1 from accessGroups array
 *
 * @returns {string[]} array containing all elements from left and right arrays. NOTE: order of left 
 * and right in return statement does not matter because one of them will always be empty at that point
 */
function merge(
    left: string[],
    right: string[]
): string[] {
    const results = [];

    while (left.length && right.length) {
        const formatted = formatSortString(left[0], right[0]);
        const leftElement = formatted[0];
        const rightElement = formatted[1];
        if (accessGroupsComparison[leftElement.toUpperCase()] < accessGroupsComparison[rightElement.toUpperCase()]) {
            results.push(left.shift());
        } else {
            results.push(right.shift());
        }
    }

    return [...results, ...left, ...right];
}

/**
 * Compares the name of the collection on the userGroup string to the name of the collection
 * that is being requested
 * If they match, return true
 * Otherwise, return false
 *
 * @param {string} userGroup the access group that belong to the current user
 * @param {string} requestedCollection the name of the collection that is being requested by the user
 *
 * @returns {boolean} true is user has access to the collection, false if otherwise
 */
function verifyCollectionAccess(
    userGroup: string,
    requestedCollection: string
): boolean {
    if (!userGroup.includes('reviewer') || !userGroup.includes('curator')) {
        throw new Error('Invalid string');
    }
    const collectionName = parseUserGroup(userGroup, true);
    if (collectionName === requestedCollection) {
        return true;
    }
    return false;
}

/**
 * Takes a string and parses the collection name out of it. The userGroup is assumed to be
 * curator or reviewer
 *
 * @param {string} userGroup the access group that belong to the current user
 *
 * @returns {string} the collection name 
 */
function parseUserGroup(userGroup: string, byCollection: boolean): string {
    const list = userGroup.split('@');
    if (byCollection) {
        const collectionName = list[1];
        return collectionName;
    } else {
        const roleName = list[0];
        return roleName;
    }   
}  

/**
 * Checks for strings containing 'curator' or 'reviwer'. Parses the role name out 
 * of those strings and returns them in an array format
 *
 * @param {string} left string representing access group
 * @param {string} right string representing access group
 *
 * @returns {string[]} string array containing formatted access group strings
 */
function formatSortString(left: string, right: string): string[] {
    let copyLeft = left;
    let copyRight = right;

    if (left.includes('curator') || left.includes('reviewer')) {
        copyLeft = parseUserGroup(left, false);
    } 

    if (right.includes('curator') || right.includes('reviewer')) {
        copyRight = parseUserGroup(right, false);
    }

    return [copyLeft, copyRight];
}

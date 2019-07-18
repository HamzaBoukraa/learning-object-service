/**
 * Interface representation of a ReleasedUserLearningObjectSearchQuery
 *
 * @export
 * @interface ReleasedUserLearningObjectSearchQuery
 */
export interface ReleasedUserLearningObjectSearchQuery {
  /**
   * Search query string to match Learning Objects by
   */
  text?: string;
}

/**
 * Interface representation of a UserLearningObjectSearchQuery
 *
 * @export
 * @interface UserLearningObjectSearchQuery
 * @extends {ReleasedUserLearningObjectSearchQuery}
 */
export interface UserLearningObjectSearchQuery
  extends ReleasedUserLearningObjectSearchQuery {
  /**
   * The status, or list of statuses the Learning Object should match
   */
  status?: string[];
  /**
   * The revision number the Learning Object should match
   */
  revision?: number;
}

/**
 * Interface representation of a UserLearningObjectQuery
 *
 * @export
 * @interface UserLearningObjectQuery
 * @extends {UserLearningObjectSearchQuery}
 */
export interface UserLearningObjectQuery extends UserLearningObjectSearchQuery {
  /**
   * Whether or not to show only draft Learning Objects
   */
  draftsOnly?: boolean;
}

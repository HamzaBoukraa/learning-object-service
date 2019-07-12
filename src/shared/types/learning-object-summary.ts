/**
 * An interface representation of the AuthorSummary type
 *
 * @export
 * @interface AuthorSummary
 */
export interface AuthorSummary {
  /**
   * Unique identifier of the author/user
   */
  id: string;
  /**
   * Human readable unique identifier of the author/user
   */
  username: string;
  /**
   * The full name of the author/user
   */
  name: string;
  /**
   * The organization of the author/user
   */
  organization: string;
}

export interface LearningObjectChildSummary {
  /**
   * The name of the Learning Object
   */
  name: string;
  /**
   * Unique identifier of the Learning Object
   */
  id: string;
}

/**
 * An interface representation of the LearningObjectSummary type
 *
 * @export
 * @interface LearningObjectSummary
 */
export interface LearningObjectSummary {
  /**
   * Unique identifier of the Learning Object
   */
  id: string;
  /**
   * Summary information of the user who authored the Learning Object
   */
  author: AuthorSummary;
  /**
   * The collection the Learning Object was submitted to
   */
  collection: string;
  /**
   * Summary of Learning Objects that exist in this Learning Object's hierarchy
   */
  children: LearningObjectSummary[];
  /**
   * Summary information about users who have made contributions to the Learning Object
   */
  contributors: AuthorSummary[];
  /**
   * Time at which the Learning Object was last updated
   * Value is a string representing the milliseconds elapsed since the UNIX epoch
   */
  date: string;
  /**
   * User supplied information about the contents/purpose of the Learning Object
   */
  description: string;
  /**
   * How long the content of the Learning Object
   */
  length: string;
  /**
   * The name of the Learning Object
   */
  name: string;
  /**
   * flag determining whether or not a learning object has an active revision
   */
  hasRevision: boolean;
  /**
   * The version number of the Learning Object
   */
  revision: number;
  /**
   * The stage within the review pipeline that the Learning Object exists
   */
  status: string;
}

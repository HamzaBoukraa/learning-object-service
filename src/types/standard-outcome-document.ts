/**
 * Define the database schema for standard outcomes.
 */
export interface StandardOutcomeDocument {
  _id?: string;
  author: string;
  name: string;
  date: string;
  outcome: string;
  source: string;
  tag: string;
}

/**
 * Define the database schema for learning outcomes.
 */
export declare interface LearningOutcomeDocument {
  _id?: string;
  source: string;
  tag: number;
  author: string;
  name: string;
  date: string;
  outcome: string;
  bloom: string;
  verb: string;
  text: string;
  mappings: string[];
}

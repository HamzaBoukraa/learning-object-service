/**
 * Define the database schema for changelogs.
 */
export interface ChangeLogDocument {
    _id: string;
    learningObjectId: string,
    log: Log[]
}

export interface Log {
    userId: string,
    date: Date,
    text: string
}
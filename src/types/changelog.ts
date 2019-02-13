/**
 * Define the database schema for changelogs.
 */
export interface ChangeLogDocument {
    _id: string;
    learningObjectId: string;
    logs: Log[];
}

export interface Log {
    userId: string;
    date: Date;
    text: string;
}

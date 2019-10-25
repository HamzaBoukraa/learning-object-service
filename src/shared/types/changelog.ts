/**
 * Define the database schema for changelogs.
 */
export interface ChangeLogDocument {
    _id: string;
    cuid: string;
    logs: Log[];
}

export interface Log {
    userId: string;
    date: Date;
    text: string;
}

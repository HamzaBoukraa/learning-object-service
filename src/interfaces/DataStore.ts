import {
    Record, Update, Insert, Edit,
    RecordID, UserID, LearningObjectID, OutcomeID,
    LearningOutcomeID, StandardOutcomeID,
    UserSchema, UserRecord, UserUpdate, UserInsert, UserEdit,
    LearningObjectSchema, LearningObjectRecord, LearningObjectUpdate,
    LearningObjectInsert, LearningObjectEdit,
    LearningOutcomeSchema, LearningOutcomeRecord, LearningOutcomeUpdate,
    LearningOutcomeInsert, LearningOutcomeEdit,
    StandardOutcomeSchema, StandardOutcomeRecord, StandardOutcomeUpdate,
    StandardOutcomeInsert, StandardOutcomeEdit,
    OutcomeRecord,
} from '@cyber4all/clark-schema';

export interface DataStore {
    connect(dburi: string): Promise<void>;
    disconnect(): void;
    insertUser(record: UserInsert): Promise<boolean | UserID>;
    insertLearningObject(record: LearningObjectInsert): Promise<LearningObjectID>;
    insertLearningOutcome(record: LearningOutcomeInsert): Promise<LearningOutcomeID>;
    insertStandardOutcome(record: StandardOutcomeInsert): Promise<StandardOutcomeID>;
    mapOutcome(outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void>;
    unmapOutcome(outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void>;
    reorderOutcome(object: LearningObjectID, outcome: LearningOutcomeID, index: number): Promise<void>;
    editUser(id: UserID, record: UserEdit): Promise<void>;
    editLearningObject(id: LearningObjectID, record: LearningObjectEdit): Promise<void>;
    editLearningOutcome(id: LearningOutcomeID, record: LearningOutcomeEdit): Promise<void>;
    deleteUser(id: UserID): Promise<void>;
    deleteLearningObject(id: LearningObjectID): Promise<void>;
    deleteMultipleLearningObjects(id: LearningObjectID[]): Promise<void>;
    deleteLearningOutcome(id: LearningOutcomeID): Promise<void>;
    emailRegistered(email: string): Promise<boolean>;
    findUser(username: string): Promise<UserID>;
    findLearningObject(username: string, name: string): Promise<LearningObjectID>;
    findLearningOutcome(source: LearningObjectID, tag: number): Promise<LearningOutcomeID>;
    fetchUser(id: UserID): Promise<UserRecord>;
    fetchLearningObject(id: UserID): Promise<LearningObjectRecord>;
    fetchLearningOutcome(id: UserID): Promise<LearningOutcomeRecord>;
    fetchOutcome(id: UserID): Promise<OutcomeRecord>;
    fetchMultipleObjects(ids: LearningObjectID[]): Promise<LearningObjectRecord[]>;
    fetchAllObjects(currPage?: number, limit?: number): Promise<{ objects: LearningObjectRecord[], total: number }>;
    searchObjects(name: string, author: string, length: string, level: string, source: string, text: string, ascending: boolean, currPage?: number, limit?: number): Promise<{ objects: LearningObjectRecord[], total: number }>;
    findMappingID(date: string, name: string, outcome: string): Promise<StandardOutcomeID>;
}
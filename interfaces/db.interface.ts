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
} from '../schema/schema';

import { Cursor } from 'mongodb';

export interface DBInterface {
    connect: (dburi: string) => Promise<void>;
    disconnect: () => void;
    insertUser: (record: UserInsert) => Promise<UserID>;
    insertLearningObject: (record: LearningObjectInsert) => Promise<LearningObjectID>;
    insertLearningOutcome: (record: LearningOutcomeInsert) => Promise<LearningOutcomeID>;
    insertStandardOutcome: (record: StandardOutcomeInsert) => Promise<StandardOutcomeID>;
    mapOutcome: (outcome: LearningOutcomeID, mapping: OutcomeID) => Promise<void>;
    unmapOutcome: (outcome: LearningOutcomeID, mapping: OutcomeID) => Promise<void>;
    reorderObject: (user: UserID, object: LearningObjectID, index: number) => Promise<void>;
    reorderOutcome: (object: LearningObjectID, outcome: LearningOutcomeID, index: number) => Promise<void>;
    editUser: (id: UserID, record: UserEdit) => Promise<void>;
    editLearningObject: (id: LearningObjectID, record: LearningObjectEdit) => Promise<void>;
    editLearningOutcome: (id: LearningOutcomeID, record: LearningOutcomeEdit) => Promise<void>;
    deleteUser: (id: UserID) => Promise<void>;
    deleteLearningObject: (id: LearningObjectID) => Promise<void>;
    deleteLearningOutcome: (id: LearningOutcomeID) => Promise<void>;
    emailRegistered: (email: string) => Promise<boolean>;
    findUser: (id: string) => Promise<UserID>;
    findLearningObject: (author: UserID, name: string) => Promise<LearningObjectID>;
    findLearningOutcome: (source: LearningObjectID, tag: number) => Promise<LearningOutcomeID>;
    fetchUser: (id: UserID) => Promise<UserRecord>;
    fetchLearningObject: (id: UserID) => Promise<LearningObjectRecord>;
    fetchLearningOutcome: (id: UserID) => Promise<LearningOutcomeRecord>;
    fetchOutcome: (id: UserID) => Promise<OutcomeRecord>;
    /*
     * TODO: interface shouldn't have mongo-specific Cursor
     */
    fetchAllObjects: () => Cursor<LearningObjectRecord>;
    searchOutcomes: (text: string) => Cursor<OutcomeRecord>;
    matchOutcomes: (text: string) => Cursor<OutcomeRecord>;
}

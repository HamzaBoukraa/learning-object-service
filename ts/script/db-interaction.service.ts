require('../useme');

import * as server from 'socket.io';

import * as db from '../db.driver';
import * as glue from '../db.gluer';
import {
    RecordID, UserID, LearningObjectID, OutcomeID,
    LearningOutcomeID, StandardOutcomeID
} from '../schema/db.schema';

import { User } from '../entity/user';
import { LearningObject } from '../entity/learning-object';
import { Outcome, StandardOutcome, LearningOutcome } from '../entity/outcome';

if (!process.env["CLARK_DB"]) process.env["CLARK_DB"] = "localhost:27017";

/*
 * TODO: catch errors gracefully, preferably with logging!
 */

db.connect(process.env["CLARK_DB"])
  .then(() => {
    let io = server.listen(27016);
    console.log("Listening on port "+27016);

    io.on('connection', function(socket) {

        socket.on('authenticate', (userid: string, pwd: string, ack: (res:boolean)=>) => {
            glue.authenticate(userid, pwd)
                .then((res)=>{ack(res)});
        });

        socket.on('loadUser', (userid: string, ack: (res:User)=>void) => {
            glue.loadUser(userid)
                .then((res)=>{ack(res)});
        });

        socket.on('loadLearningObjectSummary', (userid: string, ack: (res:LearningObject[])=>void) => {
            glue.loadLearningObjectSummary(userid)
                .then((res)=>{ack(res)});
        });
        
        socket.on('loadLearningObject', (author: UserID, name: string, ack: (res:LearningObject)=>void) => {
            glue.loadLearningObject(author, name)
                .then((res)=>{ack(res)});
        });

        socket.on('addUser', (user: User, ack: (res:UserID)=>void) => {
            glue.addUser(user)
                .then((res)=>{ack(res)});
        });

        socket.on('addLearningObject', (author: UserID, object: LearningObject, ack: (res:LearningObjectID)=>void) => {
            glue.addLearningObject(author, object)
                .then((res)=>{ack(res)});
        });
        
        socket.on('addLearningOutcome', (source: LearningObjectID, outcome: LearningOutcome, ack: (res:LearningOutcomeID)=>void) => {
            glue.addLearningOutcome(source, outcome)
                .then((res)=>{ack(res)});
        });
        
        socket.on('editUser', (id: UserID, user: User, ack: (res:void)=>void) => {
            glue.editUser(id, user)
                .then((res)=>{ack(res)});
        });

        socket.on('editLearningObject', (id: LearningObjectID, object: LearningObject, ack: (res:void)=>void) => {
            glue.editLearningObject(id, object)
                .then((res)=>{ack(res)});
        });

        socket.on('editLearningOutcome', (id: LearningOutcomeID, outcome: LearningOutcome, ack: (res:void)=>void) => {
            glue.editLearningOutcome(id, outcome)
                .then((res)=>{ack(res)});
        });
        
        socket.on('reorderObject', (user: UserID, object: LearningObjectID, index: number, ack: (res:void)=>void) => {
            db.reorderObject(user, object, index)
                .then((res)=>{ack(res)});
        });

        socket.on('reorderOutcome', (object: LearningObjectID, outcome: LearningOutcomeID, index: number, ack: (res:void)=>void) => {
            db.reorderOutcome(object, outcome, index)
                .then((res)=>{ack(res)});
        });

        socket.on('unmapOutcome', (outcome: LearningOutcomeID, mapping: OutcomeID, ack: (res:void)=>void) => {
            db.unmapOutcome(outcome, mapping)
                .then((res)=>{ack(res)});
        });

        socket.on('mapOutcome', (outcome: LearningOutcomeID, mapping: OutcomeID, ack: (res:void)=>void) => {
            db.mapOutcome(outcome, mapping)
                .then((res)=>{ack(res)});
        });

        socket.on('deleteUser', (id: UserID, ack: (res:void)=>void ) => {
            db.deleteUser(id)
                .then((res)=>{ack(res)});
        });

        socket.on('deleteLearningObject', (id: LearningObjectID, ack: (res:void)=>void ) => {
            db.deleteLearningObject(id)
                .then((res)=>{ack(res)});
        });

        socket.on('deleteLearningOutcome', (id: LearningOutcomeID, ack: (res:void)=>void ) => {
            db.deleteLearningOutcome(id)
                .then((res)=>{ack(res)});
        });

        socket.on('findUser', (id: string, ack: (res:UserID)=>void ) => {
            db.findUser(id)
                .then((res)=>{ack(res)});
        });

        socket.on('findLearningObject', (author: UserID, name: string, ack: (res:LearningObjectID)=>void ) => {
            db.findLearningObject(author, name)
                .then((res)=>{ack(res)});
        });

        socket.on('suggestOutcomes', (text: string, threshold: number, ack: (res:Outcome[])=>void) => {
            glue.suggestOutcomes(text, "text", threshold)
                .then((res)=>{ack(res)});
        });

        socket.on('suggestOutcomesREGEX', (text: string, ack: (res:Outcome[])=>void) => {
            glue.suggestOutcomes(text, "regex")
                .then((res)=>{ack(res)});
        });

    });

  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  });
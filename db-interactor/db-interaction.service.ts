require('../useme');

import * as express from 'express';
const bodyParser = require('body-parser');

import * as db from '../db.driver';
import * as glue from '../db.gluer';
import {
    RecordID, UserID, LearningObjectID, OutcomeID,
    LearningOutcomeID, StandardOutcomeID
} from '../schema/db.schema';

import { User } from '../entity/user';
import { LearningObject } from '../entity/learning-object';
import {
    Outcome, OutcomeSuggestion, StandardOutcome, LearningOutcome
} from '../entity/outcome';

/*
 * TODO: catch errors gracefully, preferably with logging!
 */
const server = express();
server.use(bodyParser.json());

db.connect(process.env["CLARK_DB_URI"])
  .then(() => {
    server.get('/authenticate', (req, res) => {
        glue.authenticate(req.body.userid, req.body.pwd)
            .then((authorized)=>{ res.send(authorized); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.get('/findUser', (req, res) => {
        db.findUser(req.body.userid)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/findLearningObject', (req, res) => {
        db.findLearningObject(req.body.author, req.body.name)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/loadUser', (req, res) => {
        glue.loadUser(req.body.id)
            .then((user)=>{ res.send(user); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/loadLearningObjectSummary', (req, res) => {
        glue.loadLearningObjectSummary(req.body.id)
            .then((objects)=>{ res.send(objects); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.get('/loadLearningObject', (req, res) => {
        glue.loadLearningObject(req.body.id)
            .then((object)=>{ res.send(object); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/addUser', (req, res) => {
        glue.addUser(req.body.user)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/addLearningObject', (req, res) => {
        glue.addLearningObject(req.body.author, req.body.object)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.get('/editUser', (req, res) => {
        glue.editUser(req.body.id, req.body.user)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.get('/updateLearningObject', (req, res) => {
        glue.updateLearningObject(req.body.id, req.body.object)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.get('/reorderObject', (req, res) => {
        db.reorderObject(req.body.user, req.body.object, req.body.index)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/unmapOutcome', (req, res) => {
        db.unmapOutcome(req.body.outcome, req.body.mapping)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/mapOutcome', (req, res) => {
        db.mapOutcome(req.body.outcome, req.body.mapping)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/deleteUser', (req, res) => {
        db.deleteUser(req.body.id)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.get('/deleteLearningObject', (req, res) => {
        db.deleteLearningObject(req.body.id)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.listen(process.env["CLARK_DB_INTERACTOR_PORT"]);
    console.log("Listening on port "+process.env["CLARK_DB_INTERACTOR_PORT"]);
  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  });
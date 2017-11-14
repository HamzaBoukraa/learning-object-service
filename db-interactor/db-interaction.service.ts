require('../useme');

import * as express from 'express';
const bodyParser = require('body-parser');

import * as db from '../db.driver';
import * as glue from '../db.gluer';

import {
    RecordID, UserID, LearningObjectID, OutcomeID,
    LearningOutcomeID, StandardOutcomeID
} from '../schema/schema';

import {
    User, LearningObject, StandardOutcome, LearningOutcome
} from '../entity/entities';

/*
 * TODO: catch errors gracefully, preferably with logging!
 */
const server = express();
server.use(bodyParser.json());

db.connect(process.env["CLARK_DB_URI"])
  .then(() => {
    server.post('/authenticate', (req, res) => {
        let userid = req.body.userid;
        let pwd = req.body.pwd;

        glue.authenticate(userid, pwd)
            .then((authorized)=>{ res.send(authorized); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.post('/findUser', (req, res) => {
        let userid = req.body.userid;

        db.findUser(userid)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/findLearningObject', (req, res) => {
        let author = req.body.author;
        let name = req.body.name;
        
        db.findLearningObject(author, name)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/loadUser', (req, res) => {
        let id = req.body.id;

        glue.loadUser(id)
            .then((user)=>{
                let msg = User.serialize(user)
                res.send(msg);
            })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/loadLearningObjectSummary', (req, res) => {
        let id = req.body.id;

        glue.loadLearningObjectSummary(id)
            .then((objects)=>{
                let msgs = objects.map(LearningObject.serialize);
                let msg = JSON.stringify(msgs);
                res.send(msg);
            })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.post('/loadLearningObject', (req, res) => {
        let id = req.body.id;

        glue.loadLearningObject(id)
            .then((object)=>{
                let msg = LearningObject.serialize(object);
                res.send(msg);
            })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/addUser', (req, res) => {
        let user = User.unserialize(req.body.user);
        glue.addUser(user)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/addLearningObject', (req, res) => {
        let author = req.body.author;
        let object = LearningObject.unserialize(req.body.object, null);

        glue.addLearningObject(author, object)
            .then((id)=>{ res.send(id); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.post('/editUser', (req, res) => {
        let id = req.body.id;
        let user = User.unserialize(req.body.user);

        glue.editUser(id, user)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.post('/updateLearningObject', (req, res) => {
        let id = req.body.id;
        let object = LearningObject.unserialize(req.body.object, null);

        glue.updateLearningObject(id, object)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });
    
    server.post('/reorderObject', (req, res) => {
        let user = req.body.user;
        let object = req.body.object;
        let index = req.body.index;

        db.reorderObject(user, object, index)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/unmapOutcome', (req, res) => {
        let outcome = req.body.outcome;
        let mapping = req.body.mapping;

        db.unmapOutcome(outcome, mapping)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/mapOutcome', (req, res) => {
        let outcome = req.body.outcome;
        let mapping = req.body.mapping;

        db.mapOutcome(outcome, mapping)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/deleteUser', (req, res) => {
        let id = req.body.id;

        db.deleteUser(id)
            .then(()=>{ res.send(); })
            .catch((err)=>{ res.send({error:err}); });
    });

    server.post('/deleteLearningObject', (req, res) => {
        let id = req.body.id;

        db.deleteLearningObject(id)
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
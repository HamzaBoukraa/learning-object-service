// tslint:disable-next-line: no-require-imports
require('../useme');

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';
import { DBGluer } from '../db.gluer';

import * as test from 'tape';
import * as rp from 'request-promise';

import {
    User,
    LearningObject,
    StandardOutcome,
    OutcomeSuggestion,
} from '../entity/entities';

let db: DBInterface = new MongoDriver();
let hash: HashInterface = new BcryptDriver(10);
let glue = new DBGluer(db, hash);

async function request(event: string, params: {}): Promise<any> {
    return rp({
        method: 'POST',
        uri: 'http://localhost:27016/' + event,
        body: params,
        json: true,
    });
}



test('authenticate', async (t) => {
    let baduser = await request('authenticate', { userid: 'eddard', pwd: 'winteriscoming' });

    t.ok(baduser.error, `- Authentication error when userid is wrong`);

    let badpwd = await request('authenticate', { userid: 'ned', pwd: 'winterhascome' });

    t.notok(badpwd.error, `- No error when pwd is wrong`);
    t.equals(badpwd, false, `- Authentication is false when pwd is wrong`);

    let right = await request('authenticate', { userid: 'ned', pwd: 'winteriscoming' });

    t.notok(right.error, `- No error when credentials are good`);
    t.equals(right, true, `- Authentication is true when credentials are good`);

    t.end();
});



test('findUser', async (t) => {
    t.plan(3);

    let baduser = await request('findUser', { userid: 'eddard' });

    t.ok(baduser.error, `- There is an error when userid is wrong`);

    let uid = await request('findUser', { userid: 'ned' });

    t.notok(uid.error, `- No error when userid is valid`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);
        let user = await glue.loadUser(uid);

        t.equals(user.id, 'ned', `- Username of found id matches original`);
    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});



test('findLearningObject', async (t) => {
    let uid = await request('findUser', { userid: 'ned' });

    let baduser = await request('findLearningObject', { author: uid + 'womp', name: 'Hand of the King' });

    t.ok(baduser.error, `- There is an error when author is wrong`);

    let badname = await request('findLearningObject', { author: uid, name: 'King of the Andals' });

    t.ok(badname.error, `- There is an error when name is wrong`);

    let obid = await request('findLearningObject', { author: uid, name: 'Hand of the King' });

    t.notok(obid.error, `- No error when author and name are valid`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);
        let object = await glue.loadLearningObject(obid);

        t.equals(object.name, 'Hand of the King', `- Name of found id matches original`);

    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});



test('loadUser', async (t) => {
    let uid = await request('findUser', { userid: 'ned' });

    let baduser = await request('loadUser', { id: uid + 'womp' });

    t.ok(baduser.error, `- There is an error when id is wrong`);

    let userstring = await request('loadUser', { id: uid });

    t.notok(userstring.error, `- No error when id is valid`);

    let user = User.unserialize(userstring);

    t.equal(user.id, 'ned', '- Reconstruction from database gives correct id');
    t.equal(user.pwd, null, '- Reconstruction from database hides password');

    t.end();
});




test('loadLearningObjectSummary', async (t) => {
    let uid = await request('findUser', { userid: 'ned' });

    let baduser = await request('loadLearningObjectSummary', { id: uid + 'womp' });

    t.ok(baduser.error, `- There is an error when id is wrong`);

    let summary = await request('loadLearningObjectSummary', { id: uid });

    t.notok(summary.error, `- No error when id is valid`);

    let objects: LearningObject[] = summary.map((a: string) => { return LearningObject.unserialize(a, null); });

    t.equal(objects.length, 2, `- Summary has correct number of elements`);

    let obj = objects[0];

    t.assert(obj.name.length > 0, '- Reconstruction from database contains name');
    t.equal(obj.goals.length, 0, '- Reconstruction from database does not contain goals');
    t.equal(obj.outcomes.length, 0, '- Reconstruction from database does not contain goals');

    t.end();
});





test('loadLearningObject', async (t) => {
    let uid = await request('findUser', { userid: 'ned' });
    let obid = await request('findLearningObject', { author: uid, name: 'Hand of the King' });

    let badobject = await request('loadLearningObject', { id: obid + 'womp' });

    t.ok(badobject.error, `- There is an error when id is wrong`);

    let objectstring = await request('loadLearningObject', { id: obid });

    t.notok(objectstring.error, `- No error when id is valid`);

    let object = LearningObject.unserialize(objectstring, null);

    t.equal(object.name, 'Hand of the King', `- Reconstruction from database gives correct name`);
    t.equal(object.goals.length, 2, `- Reconstruction from database gives correct number of goals`);
    t.equal(object.goals[1].text, `Keep the King from embarrassing himself`, `- Reconstruction from database gives the correct goals`);
    t.equal(object.outcomes.length, 3, `- Reconstruction from database gives correct number of outcomes`);
    t.equal(object.outcomes[2].text, `Advise the King`, `- Reconstruction from database gives the correct outcomes`);

    t.end();
});




test('addUser', async (t) => {
    let baduserID = await request('addUser', {
        user: User.serialize(new User(
            'ned',
            'Ned Stark',
            'ned@got.org',
            'offwithhishead',
        )),
    });

    t.ok(baduserID.error, `- There is an error adding users with duplicate ids`);

    let newuser = new User(
        'dany',
        'Daenerys Targaryen',
        'dany@got.org',
        'motherofdragons',
    );
    newuser.addObject().name = 'Queen of the Andals';

    let newuserID = await request('addUser', { user: User.serialize(newuser) });

    t.notok(newuserID.error, `- No errors adding a new user`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);
        let uid = await db.findUser('dany');

        t.equal(uid, newuserID, `- id returned by event matches an id in database`);

        let user = await glue.loadUser(uid);

        t.equal(user.id, 'dany', `- Reconstruction from database gives correct id`);
        t.equal(user.pwd, null, `- Reconstruction from database hides password`);
        t.equal(user.objects.length, 0, `- Reconstruction from database omits objects`);


    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});




test('addLearningObject', async (t) => {
    let uid = await request('findUser', { userid: 'markaddy' });

    let badnameID = await request('addLearningObject', {
        author: uid,
        object: LearningObject.serialize(new LearningObject(null, 'King of the Andals')),
    });

    t.ok(badnameID.error, `- There is an error adding objects with duplicate names`);

    let newObject = new LearningObject(null, 'Protector of the Realm');
    newObject.addGoal().text = `Um...eat more?`;
    newObject.addOutcome().text = `Hunt boar`;

    let baduserID = await request('addLearningObject', {
        author: uid + 'womp',
        object: LearningObject.serialize(newObject),
    });

    t.ok(baduserID.error, `- There is an error adding object with invalid author`);

    let newobjectID = await request('addLearningObject', {
        author: uid,
        object: LearningObject.serialize(newObject),
    });

    t.notok(newobjectID.error, `- No errors adding a new learning object`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);
        let obid = await db.findLearningObject(uid, 'Protector of the Realm');

        t.equal(obid, newobjectID, `- id returned by event matches an id in database`);

        let object = await glue.loadLearningObject(obid);

        t.equal(object.name, 'Protector of the Realm', `- Reconstruction from database gives correct name`);
        t.equal(object.goals.length, 1, `- Reconstruction from database gives correct number of goals`);
        t.equal(object.goals[0].text, `Um...eat more?`, `- Reconstruction from database gives the correct goals`);
        t.equal(object.outcomes.length, 0, `- Reconstruction from database omits outcomes`);

    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});






test('editUser', async (t) => {
    let testid = await request('findUser', { userid: 'ned' });

    let badresponse = await request('editUser', {
        id: testid + 'womp',
        user: User.serialize(new User(
            'ned',
            'Ned Stark',
            'ned@got.org',
            'offwithhishead',
        )),
    });

    t.ok(badresponse.error, `- There is an error editing an invalid user id`);

    let dupresponse = await request('editUser', {
        id: testid,
        user: User.serialize(new User(
            'markaddy',
            'Roland',
            'markaddy@akt.org',
            'thisgotweird',
        )),
    });

    t.ok(dupresponse.error, `- There is an error editing a user to an already-existing id`);

    let editid = await request('findUser', { userid: 'jsnow' });

    let newuser = new User(
        'jsnow',
        'Aegon Targaryen',
        'jsnow@got.org',
        'spoileralert',
    );
    newuser.addObject().name = 'King in the North';

    let response = await request('editUser', {
        id: editid,
        user: User.serialize(newuser),
    });

    t.notok(response, `- No errors editing a user correctly`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);
        let testuser = await glue.loadUser(testid);

        t.equal(testuser.id, 'ned', `- User id remains unedited after failed edits`);
        t.equal(testuser.name, 'Eddard Stark', `- User name remains unedited after failed edits`);
        t.equal(testuser.email, 'ned@got.org', `- User email remains unedited after failed edits`);

        let user = await glue.loadUser(editid);

        t.equal(user.id, 'jsnow', `- Reconstruction from database gives correct id`);
        t.equal(user.name, 'Aegon Targaryen', `- Reconstruction from database gives edited name`);
        t.equal(user.objects.length, 0, `- Reconstruction from database omits updated objects`);


    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});



test('updateLearningObject', async (t) => {
    // verify we CAN'T update things we oughtn't
    let testuid = await request('findUser', { userid: 'ned' });
    let testobid = await request('findLearningObject', { author: testuid, name: 'Hand of the King' });
    let testobjectstring = await request('loadLearningObject', { id: testobid });

    let testobject = LearningObject.unserialize(testobjectstring, null);
    testobject.date = '1996';

    let badresponse = await request('updateLearningObject', {
        id: testobid + 'womp',
        object: LearningObject.serialize(testobject),
    });

    t.ok(badresponse.error, `- There is an error updating an invalid object id`);

    testobject.name = 'Warden of the North';

    let dupresponse = await request('updateLearningObject', {
        id: testobid,
        object: LearningObject.serialize(testobject),
    });

    t.ok(dupresponse.error, `- There is an error editing a user to an already-existing id`);

    // verify we CAN update things we ought
    let edituid = await request('findUser', { userid: 'jsnow' });
    let editobid = await request('findLearningObject', { author: edituid, name: 'Night\'s Watch' });
    let editobjectstring = await request('loadLearningObject', { id: editobid });

    let editobject = LearningObject.unserialize(editobjectstring, null);
    editobject.name = 'Lord Commander';
    editobject.date = '1996';
    editobject.addGoal().text = `Save the world`;
    editobject.outcomes[0].text = `Hunt the living dead`;


    let response = await request('updateLearningObject', {
        id: editobid,
        object: LearningObject.serialize(editobject),
    });

    t.notok(response, `- No errors editing a user correctly`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);

        // verify we DIDN'T update things we oughtn't have
        let testdirectobject = await glue.loadLearningObject(testobid);

        t.equal(testdirectobject.name, 'Hand of the King', `- Learning object name remains unedited after failed edits`);
        t.equal(testdirectobject.date, '', `- User date remains unedited after failed edits`);

        // verify we DID update things we ought have
        let object = await glue.loadLearningObject(editobid);

        t.equal(object.name, 'Lord Commander', `- Reconstruction from database gives updated name`);
        t.equal(object.date, '1996', `- Reconstruction from database gives updated date`);
        t.equal(object.goals.length, 2, `- Reconstruction from database gives correct number of goals`);
        t.equal(object.goals[1].text, `Save the world`, `- Reconstruction from database gives the updated goals`);
        t.equal(object.outcomes.length, 3, `- Reconstruction from database gives correct number of outcomes`);
        t.equal(object.outcomes[0].text, `Hunt the living dead`, `- Reconstruction from database gives the updated outcomes`);


    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});





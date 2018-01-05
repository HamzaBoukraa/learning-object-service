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


test('emailRegistered', async (t) => {
    let bademail = await request('emailRegistered', { email: 'eddard@got.org' });

    t.notok(bademail.error, `- No error when email is wrong`);
    t.equals(bademail, false, `- Response is false when email is wrong`);

    let right = await request('emailRegistered', { email: 'ned@got.org' });

    t.notok(right.error, `- No error when email is good`);
    t.equals(right, true, `- Response is true when email is good`);

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



test('readLearningObject', async (t) => {
    let uid = await request('findUser', { userid: 'ned' });

    let baduser = await request('readLearningObject', { author: uid + 'womp', name: 'Hand of the King' });

    t.ok(baduser.error, `- There is an error when author is wrong`);

    let badname = await request('readLearningObject', { author: uid, name: 'King of the Andals' });

    t.ok(badname.error, `- There is an error when name is wrong`);

    let objectstring = await request('readLearningObject', { author: uid, name: 'Hand of the King' });

    t.notok(objectstring.error, `- No error when author and name are valid`);

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
        //t.equal(object.outcomes.length, 0, `- Reconstruction from database omits outcomes`);

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

    t.ok(badresponse && badresponse.error, `- There is an error editing an invalid user id`);

    let dupresponse = await request('editUser', {
        id: testid,
        user: User.serialize(new User(
            'markaddy',
            'Roland',
            'markaddy@akt.org',
            'thisgotweird',
        )),
    });

    t.ok(dupresponse && dupresponse.error, `- There is an error editing a user to an already-existing id`);

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

    t.ok(badresponse && badresponse.error, `- There is an error updating an invalid object id`);

    testobject.name = 'Warden of the North';

    let dupresponse = await request('updateLearningObject', {
        id: testobid,
        object: LearningObject.serialize(testobject),
    });

    t.ok(dupresponse && dupresponse.error, `- There is an error editing a user to an already-existing id`);

    // verify we CAN update things we ought
    let edituid = await request('findUser', { userid: 'jsnow' });
    let editobid = await request('findLearningObject', { author: edituid, name: 'Night\'s Watch' });
    let editobjectstring = await request('loadLearningObject', { id: editobid });

    let editobject = LearningObject.unserialize(editobjectstring, null);
    editobject.name = 'Lord Commander';
    editobject.date = '1996';
    editobject.addGoal().text = `Save the world`;
    editobject.outcomes[0].text = `Hunt the living dead`;
    let newoutcome = editobject.addOutcome();
    newoutcome.text = `Don't get stabbed in the heart`;


    let response = await request('updateLearningObject', {
        id: editobid,
        object: LearningObject.serialize(editobject),
    });

    t.notok(response, `- No errors updating an object correctly`);

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
        t.equal(object.outcomes.length, 4, `- Reconstruction from database gives correct number of outcomes`);
        t.equal(object.outcomes[0].text, `Hunt the living dead`, `- Reconstruction from database gives the updated outcomes`);
        t.ok(object.outcomes[3].text, `- Reconstruction from database has new outcome`);
        t.equal(object.outcomes[3].text, `Don't get stabbed in the heart`, `- New outcome has correct text`);

    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});



test('reorderObject', async (t) => {
    // verify we CAN'T reorder things we oughtn't
    let testuid = await request('findUser', { userid: 'ned' });
    let testobid = await request('findLearningObject', { author: testuid, name: 'Hand of the King' });

    let baduserresponse = await request('reorderObject', {
        user: testuid + 'womp',
        object: testobid,
        index: 0,
    });

    t.ok(baduserresponse && baduserresponse.error, `- There is an error reordering with an invalid user id`);

    let badobjectresponse = await request('reorderObject', {
        user: testuid,
        object: testobid + 'womp',
        index: 0,
    });

    t.ok(badobjectresponse && badobjectresponse.error, `- There is an error reordering with an invalid object id`);

    let lowindexresponse = await request('reorderObject', {
        user: testuid,
        object: testobid,
        index: -1,
    });

    t.ok(lowindexresponse && lowindexresponse.error, `- There is an error reordering to a negative index`);

    let hiindexresponse = await request('reorderObject', {
        user: testuid,
        object: testobid,
        index: 2,
    });

    t.ok(hiindexresponse && hiindexresponse.error, `- There is an error reordering to an index exceeding number of objects`);

    // verify we CAN reorder things we ought
    let edituid = await request('findUser', { userid: 'lisa' });
    let editobid = await request('findLearningObject', { author: edituid, name: 'Shadowbinder' });

    let response = await request('reorderObject', {
        user: edituid,
        object: editobid,
        index: 0,
    });

    t.notok(response, `- No errors reordering an object correctly`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);

        // verify we DIDN'T reorder things we oughtn't have
        let objects = await glue.loadLearningObjectSummary(testuid);

        t.equal(objects.length, 2, `- Number of learning objects remains unedited after failed reorders`);
        t.equal(objects[0].name, 'Warden of the North', `- First learning object is still first after failed reorders`);
        t.equal(objects[1].name, 'Hand of the King', `- Second learning object is still second after failed reorders`);

        // verify we DID reorder things we ought have
        objects = await glue.loadLearningObjectSummary(edituid);

        t.equal(objects.length, 2, `- Number of learning objects remains unedited after successful reorder`);
        t.equal(objects[0].name, 'Shadowbinder', `- Reconstruction from database gives correct first outcome`);
        t.equal(objects[1].name, 'Red Priestess', `- Reconstruction from database gives correct second outcome`);


    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});



test('mapOutcome', async (t) => {
    try {
        await db.connect(process.env.CLARK_DB_URI);

        // pick the outcomes to play with
        let uid = await db.findUser('lisa');
        let obid1 = await db.findLearningObject(uid, 'Red Priestess');
        let obid2 = await db.findLearningObject(uid, 'Shadowbinder');
        let testfrom = await db.findLearningOutcome(obid1, 0);    // should allude to fire
        let testto = await db.findLearningOutcome(obid1, 1);      // should allude to terrifying nights
        let editfrom = await db.findLearningOutcome(obid1, 2);    // should allude to princes
        let editto = await db.findLearningOutcome(obid2, 0);      // should allude to regisex

        // verify we CAN'T map things we oughtn't

        let badfromresponse = await request('mapOutcome', {
            outcome: testfrom + 'womp',
            mapping: testto,
        });

        t.ok(badfromresponse && badfromresponse.error, `- There is an error mapping from a bad outcome id`);

        let badtoresponse = await request('mapOutcome', {
            outcome: testfrom,
            mapping: testto + 'womp',
        });

        t.ok(badtoresponse && badtoresponse.error, `- There is an error mapping to a bad outcome id`);

        // verify we CAN map things we ought

        let response = await request('mapOutcome', {
            outcome: editfrom,
            mapping: editto,
        });

        t.notok(response, `- No errors mapping outcomes correctly`);

        // check database state
        let object = await glue.loadLearningObject(obid1);
        let testoutcome = object.outcomes[0];
        let editoutcome = object.outcomes[2];

        // verify we DIDN'T map things we oughtn't have
        t.equal(testoutcome.mappings.length, 0, `- Number of mappings remains unedited after failed mappings`);

        // verify we DID map things we ought have
        t.equal(editoutcome.mappings.length, 1, `- Reconstruction from database gives correct new number of mappings`);
        t.equal(
            editoutcome.mappings[0].outcome,
            `Define Sleep with all the kings`,
            `- Reconstruction from database gives correct new mappings`,
        );

    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});




test('mapOutcome', async (t) => {
    try {
        await db.connect(process.env.CLARK_DB_URI);

        // pick the outcomes to play with
        let uid = await db.findUser('ned');
        let obid = await db.findLearningObject(uid, 'Warden of the North');
        let editfrom = await db.findLearningOutcome(obid, 0);    // should allude to food
        let editto = await db.findLearningOutcome(obid, 1);      // should allude to provisions
        let testfrom = await db.findLearningOutcome(obid, 1);    // should allude to provisions

        // verify we CAN'T unmap things we oughtn't

        // ok so technically this is a bad 'to' also... I don't want to have to find the outcomeid for garrisoning the wall
        let badfromresponse = await request('unmapOutcome', {
            outcome: testfrom + 'womp',
            mapping: 'womp',
        });

        t.ok(badfromresponse && badfromresponse.error, `- There is an error unmapping from a bad outcome id`);

        let badtoresponse = await request('unmapOutcome', {
            outcome: testfrom,
            mapping: 'womp',
        });

        t.ok(badtoresponse && badtoresponse.error, `- There is an error unmapping an id that isn't mapped to`);

        // verify we CAN map things we ought

        let response = await request('unmapOutcome', {
            outcome: editfrom,
            mapping: editto,
        });

        t.notok(response, `- No errors unmapping outcomes correctly`);

        // check database state
        let object = await glue.loadLearningObject(obid);
        let editoutcome = object.outcomes[0];
        let testoutcome = object.outcomes[1];

        // verify we DIDN'T unmap things we oughtn't have
        t.equal(testoutcome.mappings.length, 1, `- Number of mappings remains unedited after failed unmappings`);
        t.equal(
            testoutcome.mappings[0].outcome,
            `Define Garrison the castles along the wall`,
            `- Mappings remain unedited after failed unmappings`,
        );

        // verify we DID unmap things we ought have
        t.equal(editoutcome.mappings.length, 1, `- Reconstruction from database gives correct new number of mappings`);
        t.equal(
            editoutcome.mappings[0].outcome,
            `Don't die.`,
            `- Other mappings remain unedited after successful unmappings`,
        );

    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});

test('deleteUser', async (t) => {
    let uid = await request('findUser', { userid: 'will' });

    let badresponse = await request('deleteUser', { id: uid + 'womp' });

    t.ok(badresponse && badresponse.error, `There is an error deleting an invalid user id`);

    let response = await request('deleteUser', { id: uid });

    t.notok(response, `No errors correctly deleting a user`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);

        db.findUser('will').then((res) => {
            t.fail('Deleted user still found in database!');
        }).catch((err) => {
            t.pass('Deleted user not found in database');
        });
    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});



test('deleteLearningObject', async (t) => {
    let uid = await request('findUser', { userid: 'tyrion' });
    let obid = await request('findLearningObject', { author: uid, name: 'Lecher' });

    let badresponse = await request('deleteLearningObject', { id: obid + 'womp' });

    t.ok(badresponse && badresponse.error, `There is an error deleting an invalid object id`);

    let response = await request('deleteLearningObject', { id: obid });

    t.notok(response, `No errors correctly deleting a learning object`);

    // check database state
    try {
        await db.connect(process.env.CLARK_DB_URI);

        let testid = await db.findUser('tyrion');

        t.ok(testid, `Deleted object's owner still found in database`);

        db.findLearningObject(testid, 'Lecher').then((res) => {
            t.fail('Deleted object still found in database!');
        }).catch((err) => {
            t.pass('Deleted object not found in database');
        });

    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        db.disconnect();
        t.end();
    }
});

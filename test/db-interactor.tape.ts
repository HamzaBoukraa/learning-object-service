// tslint:disable-next-line: no-require-imports
require('../useme');

import * as test from 'tape';
import * as rp from 'request-promise';

import { User, LearningObject, StandardOutcome, OutcomeSuggestion } from '../entity/entities';

async function request(event: string, params: {}): Promise<any> {
    return rp({
        method: 'POST',
        uri: 'http://localhost:27016/' + event,
        body: params,
        json: true,
    });
}

test('create user', async (t) => {
    t.plan(2);

    let user1 = new User('liz23', 'Elizabeth Turner', 'mrsturner@poc.org', 'i<3will');
    let uid1 = await request('addUser', { user: User.serialize(user1) } );

    t.notok(uid1.error);
    t.ok(uid1, 'uid1 is ' + JSON.stringify(uid1));

    t.end();
});

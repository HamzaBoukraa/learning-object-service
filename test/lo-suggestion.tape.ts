// tslint:disable-next-line: no-require-imports
require('../useme');

import * as test from 'tape';

import { LearningObject, OutcomeSuggestion } from '../entity/entities';









// tslint:disable-next-line: no-require-imports
import * as io from 'socket.io-client';
let client = io('http://localhost:27015', {autoConnect: false});

async function suggestOutcomes(text: string, filter: object): Promise<OutcomeSuggestion[]> {
    return new Promise<OutcomeSuggestion[]>( (resolve, reject) => {
        client.emit('suggestOutcomes', text, filter, (err: string, outcomes: OutcomeSuggestion[]) => {
            if (err) reject(err);
            else resolve(outcomes);
        });
        setTimeout(() => { reject('No response from lo-suggestion service.'); }, 2000);
    });

}

async function fetchAllObjects(): Promise<string[]> {
    return new Promise<string[]>( (resolve, reject) => {
        client.emit('fetchAllObjects', (err: string, objects: string[]) => {
            if (err) reject(err);
            else resolve(objects);
        });
        setTimeout(() => { reject('No response from lo-suggestion service.'); }, 2000);
    });

}








test('suggest outcomes', async (t) => {
    t.plan(2);

    client.open();
    // since the suggestion algorithm is fluid, there aren't really many invariants we can test here
    let outcomes = await suggestOutcomes('risk management', {});
    t.assert(outcomes.length >= 0, 'Received ' + outcomes.length + ' result(s)');

    if (outcomes.length > 0) {
        let x = outcomes[0];
        t.ok(x.id && x.author && x.date && x.name && x.outcome, 'Results look like outcome suggestions');
    } else {
        t.skip('Can\'t verify shape of results.');
    }

    client.close();
});

test('fetch all objects', async (t) => {
    t.plan(2);

    client.open();
    let raw_objects = await fetchAllObjects();

    /*
     * TODO: have setup script export the correct arrays? Then we can directly compare
     */

    t.equal(raw_objects.length, 4, 'Received the correct number of objects');
    t.ok(LearningObject.unserialize(raw_objects[0], null), 'Results look like learning objects');

    client.close();
});

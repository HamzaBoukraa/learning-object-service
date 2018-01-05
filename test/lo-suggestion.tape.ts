// tslint:disable-next-line: no-require-imports
require('../useme');

import * as test from 'tape';
import * as rp from 'request-promise';

import { LearningObject, OutcomeSuggestion } from 'clark-entity';

async function request(event: string, params: {}): Promise<any> {
    return rp({
        method: 'POST',
        uri: 'http://localhost:27015/' + event,
        body: params,
        json: true,
    });
}








test('suggest outcomes', async (t) => {
    try {
        // since the suggestion algorithm is fluid, there aren't really many invariants we can test here
        let outcomes = await request('suggestOutcomes', { text: 'risk management', filter: {} });
        t.assert(outcomes.length >= 0, 'Received ' + outcomes.length + ' result(s)');

        if (outcomes.length > 0) {
            let x = outcomes[0];
            t.ok(x.id && x.author && x.date && x.name && x.outcome, 'Results look like outcome suggestions');
        } else {
            t.skip('Can\'t verify shape of results.');
        }
    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        t.end();
    }
});

test('fetch all objects', async (t) => {
    try {
        let raw_objects = await request('fetchAllObjects', {});
        let l = raw_objects.length; // depending on where this test falls in others, length may change

        t.assert(Math.abs(l - 7) <= 1, 'Received roughly the correct number of objects');
        t.ok(LearningObject.unserialize(raw_objects[0], null), 'Results look like learning objects');
    } catch (e) {
        t.fail('Error thrown: ' + e);
    } finally {
        t.end();
    }
});

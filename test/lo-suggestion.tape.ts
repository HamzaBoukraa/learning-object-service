// tslint:disable-next-line: no-require-imports
require('../useme');

import * as test from 'tape';

import { LearningObject, OutcomeSuggestion } from '../entity/entities';









// tslint:disable-next-line: no-require-imports
import * as socket from 'socket.io-client';
let client = socket('http://localhost:27015');

async function suggestOutcomes(text: string, filter: object): Promise<OutcomeSuggestion[]> {
    return new Promise<OutcomeSuggestion[]>( (resolve, reject) => {
        client.emit('suggestOutcomes', text, filter, (err: string, outcomes: OutcomeSuggestion[]) => {
            if (err) reject(err);
            else resolve(outcomes);
        });
        setTimeout(() => { reject('No response from lo-suggestion service.'); }, 2000);
    });

}










test('suggest outcomes', async (t) => {
    t.plan(1);

    try {
        let outcomes = await suggestOutcomes('risk management', {});
        t.ok(outcomes, JSON.stringify(outcomes));
    } catch (e) {
        t.fail(e);
    }


    t.end();
    client.disconnect();
});


/**
 * Speed test fetchAllObjects response, with different parse techniques.
 */

// tslint:disable: no-require-imports
require('../useme');

import { LearningObject } from 'clark-entity';

import * as oboe from 'oboe';
import * as rp from 'request-promise';

const host = 'localhost:27015';
// const host = '54.92.208.221:27015';

async function request(event: string, params: {}): Promise<any> {
    return rp({
        method: 'POST',
        uri: 'http://' + host + '/' + event,
        body: params,
        json: true,
    });
}

function oboereq(event: string, params: {}) {
    return oboe({
        url: 'http://' + host + '/' + event,
        method: 'POST',
        body: params,
        cached: false,
    });
}


/*
 * Things to study:
 * - getting whole list vs first outcome                AF
 * - using request-promise vs oboe (whole list only)    RO
 *
 * Implement AR AO FR FO
 */
async function httpAll() {
    let start = Date.now();
    return new Promise<number>((resolve, reject) => {
        request('fetchAllObjects', {})
            .then(function (outcomes) { resolve(Date.now() - start); })
            .catch((reason) => { reject(reason); });
    });
}

async function oboeAll() {
    let start = Date.now();
    return new Promise<number>((resolve, reject) => {
        oboereq('fetchAllObjects', {})
            .done(function (outcomes) { resolve(Date.now() - start); })
            .fail((reason) => { reject(reason); });
    });
}

async function oboeOne() {
    let start = Date.now();
    return new Promise<number>((resolve, reject) => {
        oboereq('fetchAllObjects', {})
            .node('!.*', function (node, path, ancestors) {
                let gotit = Date.now() - start;
                this.abort();
                resolve(gotit);
            })
            .fail((reason) => { reject(reason.thrown); });
    });
}



interface Result {
    name: string;
    mean: number;
    std: number;
}

async function runTrials(N: number, test: () => Promise<number>): Promise<Result> {
    let sumT = 0, sumT2 = 0;
    for (let i = 1; i <= N; i ++) {
        let time = await test();
        sumT += time;
        sumT2 += time * time;
    }
    let u = sumT / N;
    let s = Math.sqrt(sumT2 / N - u * u);
    return Promise.resolve({
        name: test.name,
        mean: u,
        std: s,
    });
}

/**
 *  warm up the ... network? I don't know...but without this step,
 *      the first test always takes longer
 * Tweak the argument until the first test seems consistent.
 */
async function warmUp(N: number) {
    for (let i = 0; i < N; i ++) {
        await oboeOne();
    }
    return Promise.resolve();
}


if (require.main === module) {
    let N = 50;

    warmUp(50)
    .then(() => { return runTrials(N, httpAll); })
    .then((r: Result) => {
        console.log(r.name + '\t' + r.mean + '\t' + r.std);
        return Promise.resolve();
    })
    .then(() => { return runTrials(N, oboeAll); })
    .then((r: Result) => {
        console.log(r.name + '\t' + r.mean + '\t' + r.std);
        return Promise.resolve();
    })
    .then(() => { return runTrials(N, oboeOne); })
    .then((r: Result) => {
        console.log(r.name + '\t' + r.mean + '\t' + r.std);
        return Promise.resolve();
    })
    .catch((err) => { console.log(err); });
}

// tslint:disable: no-require-imports
require('../useme');

const host = 'localhost:27015';  // local
// const host = '54.92.208.221:27015'; // production
const clientport = 5000;

import * as express from 'express';
// tslint:disable-next-line: no-require-imports
const bodyParser = require('body-parser');
const cors = require('cors');

import * as rp from 'request-promise';

// serve client folder
let app = express();
app.use(cors());
app.use(bodyParser.json());


app.use(
    [
    '/',
    '/angular.js',
    '/\.*.json',
    ],
    express.static('compare/compare-objects'),
);

app.post('/*', (req, res) => {
    console.log('Passing on request: ' + req.url);
    let start = Date.now();
    rp({
        method: 'POST',
        uri: 'http://' + host + req.url,
        body: req.body,
        json: true,
    }).then((objects) => {
        if (objects.error) console.log(objects.error);

        let time = Date.now() - start;
        console.log('Resolving request: ' + req.url + ' (took ' + time + ' ms)');
        res.json({
            time: time,
            objects: objects,
        });
    }).catch((err) => {
        console.log('Error: ' + err);
    });
});

app.listen(clientport);
console.log('Find the client at port ' + clientport);

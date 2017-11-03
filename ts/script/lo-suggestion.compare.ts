const port = 5000;
const servicesFile = "client/services.json";

import * as express from 'express';
import * as jsonfile from 'jsonfile';

import * as db from '../db.driver';

let services = jsonfile.readFileSync(servicesFile);
db.connect()
  .then(() => {
    for (let name in services) {
        require('./lo-suggestion.'+name).listen(services[name]);
        console.log(name+" suggestion service listening on port "+services[name]);
    }
  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  });

// serve client folder
var app = express();
app.use(express.static('client'));
app.listen(port);
console.log("Server listenting on port "+port);
require('../useme');

import * as server from 'socket.io';

import * as db from '../db.driver';
import * as text from './lo-suggestion.text';

db.connect()
  .then(() => {
    text.listen(3000);
    console.log("Listening on port "+3000);
  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  });


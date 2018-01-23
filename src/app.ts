import { ExpressDriver, MongoDriver } from './drivers/drivers';
import { DataStore, HashInterface } from './interfaces/interfaces';
import { BcryptDriver } from './drivers/BcryptDriver';

// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------
let dataStore: DataStore = new MongoDriver();
let hasher: HashInterface = new BcryptDriver(10);
// ----------------------------------------------------------------------------------
ExpressDriver.start(dataStore, hasher);

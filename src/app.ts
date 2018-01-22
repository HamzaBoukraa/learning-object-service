\import { ExpressDriver, MongoDriver} from './drivers/drivers';
import { DataStore, HashInterface} from './interfaces/interfaces';
import { BcryptDriver } from './drivers/BcryptDriver';
import { Db } from 'mongodb';

// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------
let db: Db;
let dataStore: DataStore = new MongoDriver(db);
let hasher: HashInterface = new BcryptDriver(10);
// ----------------------------------------------------------------------------------
ExpressDriver.start(dataStore,hasher);

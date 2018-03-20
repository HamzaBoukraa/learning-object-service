import { ExpressDriver, MongoDriver } from './drivers/drivers';
import { DataStore } from './interfaces/interfaces';

// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------
let dataStore: DataStore = new MongoDriver();
// ----------------------------------------------------------------------------------
ExpressDriver.start(dataStore);

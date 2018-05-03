import { ExpressDriver, MongoDriver, S3Driver } from './drivers/drivers';
import { DataStore, FileManager } from './interfaces/interfaces';

// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------
const dataStore: DataStore = new MongoDriver();

const fileManager: FileManager = new S3Driver();

// ----------------------------------------------------------------------------------
ExpressDriver.start(dataStore, fileManager);

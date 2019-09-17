import { MongoClient } from 'mongodb';

export class MongoConnector {
  private static mongoClient: MongoClient;

  /**
   * Opens a new connection to the database that can be shared via
   * the getConnection function.
   * @param dburi the URI of the MongoDB instance to connect to.
   */
  static async open(dburi: string): Promise<void> {
    if (!MongoConnector.mongoClient) {
      const driver = new MongoConnector();
      await driver.connect(dburi);
    } else {
      throw new Error('There can be only one MongoClient');
    }
  }

  /**
   * Retrieves the client with an open connection to the database.
   */
  static client(): MongoClient {
    return this.mongoClient;
  }

  /**
   * Connect to the database. Must be called before any other functions.
   * @param {string} dbURI the host and port on which mongodb is running
   */
  private async connect(dbURI: string): Promise<void> {
    MongoConnector.mongoClient = await new MongoClient(dbURI, {
      useNewUrlParser: true,
    }).connect();
  }

  /**
   * Close the database. Note that this will affect all services
   * and scripts using the database, so only do this if it's very
   * important or if you are sure that *everything* is finished.
   */
  static disconnect(): Promise<void> {
    return MongoConnector.mongoClient.close();
  }
}

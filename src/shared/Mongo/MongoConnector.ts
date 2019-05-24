import { MongoClient, Db } from 'mongodb';
import { reportError } from '../../drivers/SentryConnector';
import { ServiceError, ServiceErrorReason } from '../errors';

export class MongoConnector {
  private static mongoClient: MongoClient;

  /**
   * Opens a new connection to the database that can be shared via
   * the getConnection function.
   * @param dburi the URI of the MongoDB instance to connect to.
   */
  static async open(dburi: string): Promise<void> {
    try {
      if (!MongoConnector.mongoClient) {
        const driver = new MongoConnector();
        await driver.connect(dburi);
      } else {
        return Promise.reject(
          new Error('There can be only one MongoClient'),
        );
      }
    } catch (error) {
      reportError(error);
      return Promise.reject(
        new ServiceError(
          ServiceErrorReason.INTERNAL,
        ),
      );
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
   * @param {string} dbIP the host and port on which mongodb is running
   */
  private async connect(dbURI: string, retryAttempt?: number): Promise<void> {
    try {
      MongoConnector.mongoClient = await new MongoClient(dbURI, {reconnectTries: 1).connect();
    } catch (e) {
      if (!retryAttempt) {
        this.connect(dbURI, 1);
      } else {
        return Promise.reject(
          'Problem connecting to database at ' + dbURI + ':\n\t' + e,
        );
      }
    }
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

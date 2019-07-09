import { Readable } from 'stream';

export abstract class CCLicenseRetriever {
  /**
   * Returns a readable stream of the latest Creative Commons license
   *
   * @abstract
   * @returns {Promise<Readable>}
   * @memberof CCLicenseRetriever
   */
  abstract getLatestLicense(): Promise<Readable>;
}

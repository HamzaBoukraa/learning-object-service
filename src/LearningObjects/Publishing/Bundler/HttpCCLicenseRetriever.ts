import { CCLicenseRetriever } from './CCLicenseRetriever';
import { Readable } from 'stream';
import * as https from 'https';

const LATEST_CC_LICENSE_URI = process.env.CC_LICENSE_URI;

export class HttpCCLicenseRetriever implements CCLicenseRetriever {
  getLatestLicense(): Promise<Readable> {
    return this.fetchReadableStream(LATEST_CC_LICENSE_URI);
  }

  /**
   * Returns Readable data stream from request at given uri
   *
   * @param {string} uri [URI of the resource requested]
   * @returns {Promise<Readable>}
   */
  private fetchReadableStream(uri: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      https
        .get(uri, response => {
          resolve(response);
        })
        .on('error', e => {
          reject(e);
        });
    });
  }
}

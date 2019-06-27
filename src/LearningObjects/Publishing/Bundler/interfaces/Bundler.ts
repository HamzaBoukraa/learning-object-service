import { BundleData, Writable, BundleExtension } from '../typings';

export abstract class Bundler {
  /**
   * Bundles data into archive with provided extension. Writes archive data into write stream
   *
   * @param  {Writable} writeStream [The write stream the archive data should be written to]
   * @param {BundleData[]} bundleData [File metadata including path information and Readable data to be bundled]
   * @param {BundleExtension} extension [The extension of the bundle]
   * @memberof Bundler
   */
  abstract bundleData(params: {
    writeStream: Writable;
    bundleData: BundleData[];
    extension: BundleExtension;
  }): void;
}

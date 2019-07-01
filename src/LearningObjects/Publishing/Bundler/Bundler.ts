import { BundleData, Writable, BundleExtension, Readable } from './typings';

export abstract class Bundler {
  /**
   * Bundles data into archive with provided extension. Writes archive data into write stream
   *
   * @param {BundleData[]} bundleData [File metadata including path information and Readable data to be bundled]
   * @param {BundleExtension} extension [The extension of the bundle]
   * @memberof Bundler
   */
  abstract bundleData(params: {
    bundleData: BundleData[];
    extension: BundleExtension;
  }): Promise<Readable>;
}

import { Bundler } from './Bundler';
import {  BundleData, BundleExtension, Readable } from './typings';
import { create, Archiver } from 'archiver';

/**
 * Bundler implementation using the `archiver` package as the Driver
 *
 * @export
 * @class ArchiverBundler
 * @implements {Bundler}
 */
export class ArchiverBundler implements Bundler {
  /**
   * Bundles data into an archive and pipes archive into the write stream
   *
   * @param  {BundleData[]} bundleData [The data to be piped into the archive]
   * @param  {BundleExtension} extension [The extension to use for the archive]
   * @memberof ArchiverBundler
   */
  async bundleData({
    bundleData,
    extension,
  }: {
    bundleData: BundleData[];
    extension: BundleExtension;
  }): Promise<Readable> {
    const archive = this.createArchive({ extension });
    await this.appendData({ archive, bundleData });
    archive.finalize();
    return archive;
  }

  /**
   * Creates archive with .zip extensions and pipes archive data to write stream
   *
   * @private
   * @param {Writable} writeStream [The write stream the data will be piped into]
   * @returns
   * @memberof ArchiverBundler
   */
  private createArchive({
    extension = BundleExtension.Zip,
  }: {
    extension: BundleExtension;
  }) {
    const archive = create(extension, { zlib: { level: 9 } });
    return archive;
  }

  /**
   * Attaches event listeners to archiver
   *
   * @private
   * @param {Archiver} archive archive [The current archive to append data to]
   * @param {BundleData[]} bundleData [The list of data containing files' name, path, and read stream]
   * @memberof ArchiverBundler
   */
  private async appendData({
    archive,
    bundleData,
  }: {
    archive: Archiver;
    bundleData: BundleData[];
  }): Promise<void> {
    if (!Array.isArray(bundleData)) {
      return;
    }
    for (let fileData of bundleData) {
      archive.append(fileData.data, {
        name: fileData.name,
        prefix: fileData.prefix || '',
      });
    }
  }
}

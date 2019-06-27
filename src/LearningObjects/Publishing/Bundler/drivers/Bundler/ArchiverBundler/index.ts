import { Bundler } from '../../../interfaces';
import { Writable, BundleData, BundleExtension } from '../../../typings';
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
   * @param  {Writable} writeStream [The write stream the data will be piped into]
   * @param  {BundleData[]} bundleData [The data to be piped into the archive]
   * @param  {BundleExtension} extension [The extension to use for the archive]
   * @memberof ArchiverBundler
   */
  bundleData({
    writeStream,
    bundleData,
    extension,
  }: {
    writeStream: Writable;
    bundleData: BundleData[];
    extension: BundleExtension;
  }) {
    const archive = this.createArchive({ writeStream, extension });
    this.attachListeners({ archive, writeStream });
    this.appendData({ archive, bundleData });
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
    writeStream,
    extension = BundleExtension.Zip,
  }: {
    writeStream: Writable;
    extension: BundleExtension;
  }) {
    const archive = create(extension, { zlib: { level: 9 } });
    return archive;
  }

  /**
   * Attaches event listeners to archiver
   *
   * @private
   * @param {Archiver} archive [The current archive to listen for events on]
   * @param {Writable} writeStream [The write stream the listeners will act upon]
   * @memberof ArchiverBundler
   */
  private attachListeners({
    archive,
    writeStream,
  }: {
    archive: Archiver;
    writeStream: Writable;
  }): void {
    archive.on('error', (e: Error) => writeStream.destroy(e));
  }

  /**
   * Attaches event listeners to archiver
   *
   * @private
   * @param {Archiver} archive archive [The current archive to append data to]
   * @param {BundleData[]} bundleData [The list of data containing files' name, path, and read stream]
   * @memberof ArchiverBundler
   */
  private appendData({
    archive,
    bundleData,
  }: {
    archive: Archiver;
    bundleData: BundleData[];
  }): void {
    if (Array.isArray(bundleData)) {
      bundleData.forEach(fileData => {
        archive.append(fileData.data, {
          name: fileData.name,
          prefix: fileData.prefix || '',
        });
      });
    }
  }
}

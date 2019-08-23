import { ArchiverBundler } from './ArchiverBundler';
import { BundleExtension, Writable } from '../../typings';
import * as fs from 'fs';
describe('ArchiverBundler', () => {
  const bundler: ArchiverBundler = new ArchiverBundler();
  let writeStream: Writable;
  const TEMP_PATH = './temp';

  beforeEach(() => {
    writeStream = fs.createWriteStream(TEMP_PATH);
  });

  afterEach(() => {
    writeStream.end();
    fs.unlinkSync(TEMP_PATH);
  });

  describe('bundleData', () => {
    it('should bundle data into write stream', () => {
      bundler.bundleData({
        bundleData: [],
        extension: BundleExtension.Zip,
      });
    });
  });
});

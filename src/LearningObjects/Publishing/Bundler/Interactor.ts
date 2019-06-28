import 'dotenv/config';
import {
  Bundler,
} from './interfaces';
import {
  LearningObject,
  Writable,
  Readable,
  UserToken,
  BundleData,
  BundleExtension,
  ExpressResponse,
} from './typings';
import { reportError } from '../../../shared/SentryConnector';
import * as https from 'https';
import { ServiceError, ServiceErrorReason } from '../../../shared/errors';
import { BundlerModule } from './BundlerModule';


/**
 * Encapsulates Drivers used within this interactor in a namespace
 */
namespace Drivers {
  export const bundler = () => BundlerModule.resolveDependency(Bundler);
}

const CC_LICENSE = {
  uri: process.env.CC_LICENSE_URI,
  name: 'LICENSE.pdf',
};

/**
 * Handles Learning Object download by setting up listeners on the `writeStream`
 * Setting attachment on `writeStream` if requested,
 * Getting BundleData for `learningObject`
 * Bundling `learningObject` data using Bundler
 * Updating download status of `learningObject` for the requester
 *
 * @param {LearningObject} learningObject [The Learning Object to be downloaded]
 * @param {string} requesterUsername [The username of the requester]
 * @param {Writable} writeStream [The write stream the download/bundle will be written to]
 * @returns
 */
export async function bundleLearningObject({
  learningObject,
  requesterUsername,
}: {
  learningObject: LearningObject;
  requesterUsername: string;
}) {
  const extension = BundleExtension.Zip;

  const objectData = await openFileStreams({ learningObject });
  return Drivers.bundler().bundleData({
    bundleData: objectData,
    extension,
  });
}

/**
 * Bundles Learning Object with Creative Common's License, Readme, attached files, and children
 *
 * @param {LearningObject} [The Learning Object to be bundled]
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
async function openFileStreams({
  learningObject,
  prefix = '',
}: {
  learningObject: LearningObject;
  prefix?: string;
}): Promise<BundleData[]> {
  try {
    const [license, readMe, files, children] = await Promise.all([
      bundleCCLicense(prefix),
      bundleReadMe({
        uri: learningObject.materials.pdf.url,
        name: learningObject.materials.pdf.name,
        prefix,
      }),
      bundleFiles({ files: learningObject.materials.files, prefix }),
      bundleChildren({
        children: learningObject.children,
        prefix,
      }),
    ]);
    return [license, readMe, ...files, ...children];
  } catch (error) {
    reportError(error);
    throw new ServiceError(ServiceErrorReason.INTERNAL);
  }
}

/**
 * Bundles the Creative Common License
 *
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData>}
 */
async function bundleCCLicense(prefix: string = ''): Promise<BundleData> {
  const data = await fetchReadableStream(CC_LICENSE.uri);
  return { data, name: CC_LICENSE.name, prefix };
}

/**
 * Bundles the Learning Object's ReadMe
 *
 * @param {string} uri [URI of the ReadMe file]
 * @param {string} name [Name of the ReadMe file]
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData>}
 */
async function bundleReadMe({
  uri,
  name,
  prefix = '',
}: {
  uri: string;
  name: string;
  prefix?: string;
}): Promise<BundleData> {
  const data = await fetchReadableStream(uri);
  return { data, name: name, prefix };
}

/**
 * Bundles Learning Object's files
 *
 * @param {LearningObject.Material.File[]} files [List of file data from the Learning Object to get bundled];
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
async function bundleFiles({
  files,
  prefix = '',
}: {
  files: LearningObject.Material.File[];
  prefix?: string;
}): Promise<BundleData[]> {
  return Promise.all(
    files.map(async file => {
      const data = await fetchReadableStream(file.url);
      return { data, name: file.fullPath || file.name, prefix };
    }),
  );
}

/**
 * Recursively bundles child objects
 *
 * @param {LearningObject[]} children [Array of child Learning Objects]
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
async function bundleChildren({
  children,
  prefix = '',
}: {
  children: LearningObject[];
  prefix: string;
}): Promise<BundleData[]> {
  const childrenBundleData = await Promise.all([
    ...children.map(child => {
      // This is to ensure that the prefix property is only utilized at the first layer of children and below
      const path = `${prefix}/${buildDirectoryName(child)}`;
      return openFileStreams({
        learningObject: child,
        prefix: path,
      });
    }),
  ]);
  return flattenDeep(childrenBundleData);
}

/**
 * Takes a learning object and returns the full directory name.
 *
 * @param {LearningObject} object [The learning object that the directory is for]
 */
function buildDirectoryName(object: LearningObject): string {
  return `${sanitizeInvalidChars(object.name)} - ${object.length
    .charAt(0)
    .toUpperCase() + object.length.substr(1)}`;
}

/**
 * Recursively flattens array of arrays
 *
 * Taken from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat#Alternative
 *
 * @param {Array<any>} array [The array to be flattened]
 * @returns
 */
function flattenDeep(array: Array<any>): any[] {
  return array.reduce(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val),
    [],
  );
}

/**
 * Returns Readable data stream from request at given uri
 *
 * @param {string} uri [URI of the resource requested]
 * @returns {Promise<Readable>}
 */
function fetchReadableStream(uri: string): Promise<Readable> {
  return new Promise((resolve, reject) => {
    https.get(uri, (response) => {
      resolve(response);
    });
  });
}

/**
 * Sanitizes file name by replacing invalid characters and restricting length
 *
 * @param {string} name
 * @returns {string}
 */
function sanitizeFileName(name: string): string {
  const MAX_CHAR = 250;
  let clean = sanitizeInvalidChars(name);
  if (clean.length > MAX_CHAR) {
    clean = clean.slice(0, MAX_CHAR);
  }
  return clean;
}

/**
 * Replaces invalid file path characters with _ characters
 *
 * @param {string} path
 * @returns {string}
 */
function sanitizeInvalidChars(path: string): string {
  return path.replace(/[\\/:"*?<>|]/gi, '_');
}

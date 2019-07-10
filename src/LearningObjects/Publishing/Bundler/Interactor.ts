import 'dotenv/config';
import {
  Bundler,
} from './Bundler';
import {
  LearningObject,
  Writable,
  Readable,
  UserToken,
  BundleData,
  BundleExtension,
} from './typings';
import { reportError } from '../../../shared/SentryConnector';
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
 * bundleLearningObject creates a bundle of all materials for a Learning Object.
 *
 * @param {LearningObject} learningObject [The Learning Object to be downloaded]
 * @param {string} requesterUsername [The username of the requester]
 * @returns a stream of the archive file that contains the bundled Learning Object
 */
export async function bundleLearningObject({
  learningObject,
  requesterUsername,
}: {
  learningObject: LearningObject;
  requesterUsername: string;
}) {
  const extension = BundleExtension.Zip;
  const objectData = buildBundleStructure({ learningObject });
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
function buildBundleStructure({
  learningObject,
  prefix = '',
}: {
  learningObject: LearningObject;
  prefix?: string;
}): BundleData[] {
  try {
    const [license, readMe, files, children] = [
      addCCLicense(prefix),
      addReadMe({
        name: learningObject.materials.pdf.name,
        prefix,
      }),
      addFiles({ files: learningObject.materials.files, prefix }),
      addChildren({
        children: learningObject.children,
        prefix,
      }),
    ];
    return [license, readMe, ...files, ...children];
  } catch (error) {
    reportError(error);
    throw new ServiceError(ServiceErrorReason.INTERNAL);
  }
}

/**
 * addCCLicense creates a BundleData object that indicates the placement of the Creative Commons License in the bundle.
 *
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 */
function addCCLicense(prefix: string = ''): BundleData {
  return { name: CC_LICENSE.name, prefix, uri: CC_LICENSE.uri };
}

/**
 * addReadMe creates a BundleData object that indicates the placement of a Learning Object's README file in the bundle.
 *
 * @param {string} name [Name of the ReadMe file]
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData>}
 */
function addReadMe({
  name,
  prefix = '',
}: {
  name: string;
  prefix?: string;
}): BundleData {
  return { name, prefix, uri: null };
}

/**
 * addFiles iterates through a Learning Object's file metadata in order to create BundleData objects noting where to
 * place each file inside of the bundle.
 *
 * @param {LearningObject.Material.File[]} files [List of file data from the Learning Object to get bundled];
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
function addFiles({
  files,
  prefix = '',
}: {
  files: LearningObject.Material.File[];
  prefix?: string;
}): BundleData[] {
  return files.map(file => {
    return { name: file.fullPath || file.name, prefix, uri: file.url };
  });
}

/**
 * addChildren triggers the process of building a bundle structure for each child of a Learning Object.
 *
 * @param {LearningObject[]} children [Array of child Learning Objects]
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
function addChildren({
  children,
  prefix = '',
}: {
  children: LearningObject[];
  prefix: string;
}): BundleData[] {
  const childrenBundleData = children.map(child => {
    // This is to ensure that the prefix property is only utilized at the first layer of children and below
    const path = `${prefix}/${buildDirectoryName(child)}`;
    return buildBundleStructure({
      learningObject: child,
      prefix: path,
    });
  });
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

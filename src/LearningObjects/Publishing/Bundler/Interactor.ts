import 'dotenv/config';
import { Bundler } from './Bundler';
import { LearningObject, BundleData, BundleExtension } from './typings';
import { BundlerModule } from './BundlerModule';
import { CCLicenseRetriever } from './CCLicenseRetriever';
import { FileGateway } from './FileGateway';
import { handleError } from '../../../interactors/LearningObjectInteractor';

/**
 * Encapsulates Drivers used within this interactor in a namespace
 */
namespace Drivers {
  export const bundler = () => BundlerModule.resolveDependency(Bundler);
  export const ccLicenseRetriever = () =>
    BundlerModule.resolveDependency(CCLicenseRetriever);
}

namespace Gateways {
  export const fileGateway = () => BundlerModule.resolveDependency(FileGateway);
}

const CC_LICENSE = {
  name: 'LICENSE.pdf',
};

/**
 * bundleLearningObject creates a bundle of all materials for a Learning Object.
 *
 * @param {LearningObject} learningObject [The Learning Object to be downloaded]
 * @returns a stream of the archive file that contains the bundled Learning Object
 */
export async function bundleLearningObject({
  learningObject,
}: {
  learningObject: LearningObject;
}) {
  const extension = BundleExtension.Zip;
  const objectData = await buildBundleStructure({ learningObject });
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
async function buildBundleStructure({
  learningObject,
  prefix = '',
}: {
  learningObject: LearningObject;
  prefix?: string;
}): Promise<BundleData[]> {
  try {
    const [license, readMe, files, children] = await Promise.all([
      addCCLicense(prefix),
      addReadMe({
        authorUsername: learningObject.author.username,
        learningObjectId: learningObject.id,
        name: learningObject.materials.pdf.name,
        prefix,
      }),
      addFiles({
        authorUsername: learningObject.author.username,
        learningObjectId: learningObject.id,
        files: learningObject.materials.files,
        prefix,
      }),
      addChildren({
        children: learningObject.children,
        prefix,
      }),
    ]);
    return [license, readMe, ...files, ...children];
  } catch (e) {
    handleError(e);
  }
}

/**
 * addCCLicense creates a BundleData object that indicates the placement of the Creative Commons License in the bundle.
 *
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 */
async function addCCLicense(prefix: string = ''): Promise<BundleData> {
  return {
    name: CC_LICENSE.name,
    prefix,
    data: await Drivers.ccLicenseRetriever().getLatestLicense(),
  };
}

/**
 * addReadMe creates a BundleData object that indicates the placement of a Learning Object's README file in the bundle.
 *
 *  @param {string} authorUsername [The username of the Learning Object's author]
 * @param {string} learningObjectId [The id of the Learning Object]
 * @param {string} name [Name of the ReadMe file]
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData>}
 */
async function addReadMe({
  authorUsername,
  learningObjectId,
  name,
  prefix = '',
}: {
  authorUsername: string;
  learningObjectId: string;
  name: string;
  prefix?: string;
}): Promise<BundleData> {
  return {
    name,
    prefix,
    data: await Gateways.fileGateway().getFileStream({
      authorUsername,
      learningObjectId,
      path: name,
    }),
  };
}

/**
 * addFiles iterates through a Learning Object's file metadata in order to create BundleData objects noting where to
 * place each file inside of the bundle.
 *
 * @param {string} authorUsername [The username of the Learning Object's author]
 * @param {string} learningObjectId [The id of the Learning Object]
 * @param {LearningObject.Material.File[]} files [List of file data from the Learning Object to get bundled];
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
function addFiles({
  authorUsername,
  learningObjectId,
  files,
  prefix = '',
}: {
  authorUsername: string;
  learningObjectId: string;
  files: LearningObject.Material.File[];
  prefix?: string;
}): Promise<BundleData[]> {
  return Promise.all(
    files.map(async file => {
      return {
        name: file.fullPath || file.name,
        prefix,
        data: await Gateways.fileGateway().getFileStream({
          authorUsername,
          learningObjectId,
          path: file.fullPath || file.name,
        }),
      };
    }),
  );
}

/**
 * addChildren triggers the process of building a bundle structure for each child of a Learning Object.
 *
 * @param {LearningObject[]} children [Array of child Learning Objects]
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
async function addChildren({
  children,
  prefix = '',
}: {
  children: LearningObject[];
  prefix: string;
}): Promise<BundleData[]> {
  const childrenBundleData = await Promise.all(
    children.map(child => {
      // This is to ensure that the prefix property is only utilized at the first layer of children and below
      const path = `${prefix}/${buildDirectoryName(child)}`;
      return buildBundleStructure({
        learningObject: child,
        prefix: path,
      });
    }),
  );
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
 * Replaces invalid file path characters with _ characters
 *
 * @param {string} path
 * @returns {string}
 */
function sanitizeInvalidChars(path: string): string {
  return path.replace(/[\\/:"*?<>|]/gi, '_');
}

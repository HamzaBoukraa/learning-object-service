import 'dotenv/config';
import {
  LearningObject,
  BundleData,
  BundleExtension,
  HierarchicalLearningObject,
} from './typings';
import { BundlerModule } from './BundlerModule';
import { Bundler, LicenseRetriever, FileGateway } from './interfaces';
import { handleError } from '../../../shared/errors';

/**
 * Encapsulates Drivers used within this interactor in a namespace
 */
namespace Drivers {
  export const bundler = () => BundlerModule.resolveDependency(Bundler);
  export const licenseRetriever = () =>
    BundlerModule.resolveDependency(LicenseRetriever);
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
 * @param {HierarchicalLearningObject} learningObject [The Learning Object to be downloaded]
 * @returns a stream of the archive file that contains the bundled Learning Object
 */
export async function bundleLearningObject({
  learningObject,
}: {
  learningObject: HierarchicalLearningObject;
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
 * @param {HierarchicalLearningObject} [The Learning Object to be bundled]
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
async function buildBundleStructure({
  learningObject,
  prefix = '',
}: {
  learningObject: HierarchicalLearningObject;
  prefix?: string;
}): Promise<BundleData[]> {
  try {
    const [license, readMe, files, children] = await Promise.all([
      addCCLicense(prefix),
      addReadMe({
        authorUsername: learningObject.author.username,
        learningObjectCUID: learningObject.cuid,
        learningObjectRevisionId: learningObject.revision,
        name: learningObject.materials.pdf.name,
        prefix,
      }),
      addFiles({
        authorUsername: learningObject.author.username,
        learningObjectCUID: learningObject.cuid,
        learningObjectRevisionId: learningObject.revision,
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
    data: await Drivers.licenseRetriever().getLicense(),
  };
}

/**
 * addReadMe creates a BundleData object that indicates the placement of a Learning Object's README file in the bundle.
 *
 *  @param {string} authorUsername [The username of the Learning Object's author]
 * @param {string} learningObjectId [The id of the Learning Object]
 * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
 * @param {string} name [Name of the ReadMe file]
 * @param {string} prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData>}
 */
async function addReadMe({
  authorUsername,
  learningObjectCUID,
  learningObjectRevisionId,
  name,
  prefix = '',
}: {
  authorUsername: string;
  learningObjectCUID: string;
  learningObjectRevisionId: number;
  name: string;
  prefix?: string;
}): Promise<BundleData> {
  return {
    name,
    prefix,
    data: await Gateways.fileGateway().getFileStream({
      authorUsername,
      learningObjectCUID,
      learningObjectRevisionId,
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
 * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
 * @param {LearningObject.Material.File[]} files [List of file data from the Learning Object to get bundled];
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
function addFiles({
  authorUsername,
  learningObjectCUID,
  learningObjectRevisionId,
  files,
  prefix = '',
}: {
  authorUsername: string;
  learningObjectCUID: string;
  learningObjectRevisionId: number;
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
          learningObjectCUID,
          learningObjectRevisionId,
          path: file.fullPath || file.name,
        }),
      };
    }),
  );
}

/**
 * addChildren triggers the process of building a bundle structure for each child of a Learning Object.
 *
 * @param {HierarchicalLearningObject[]} children [Array of child Learning Objects]
 * @param {string}: prefix [File path prefix (ie. fileName: 'World.txt', prefix: 'Hello' = filePath: 'Hello/World.txt')]
 * @returns {Promise<BundleData[]>}
 */
async function addChildren({
  children,
  prefix = '',
}: {
  children: HierarchicalLearningObject[];
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

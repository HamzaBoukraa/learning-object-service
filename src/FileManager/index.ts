import { FileManagerAdapter } from './FileManagerAdapter';
import { FileManagerAdapterStub } from './FileManagerAdapterStub';

const Adapter = process.env.NODE_ENV === 'testing'
 ? FileManagerAdapter
 : FileManagerAdapterStub;
export { Adapter as FileManagerAdapter };

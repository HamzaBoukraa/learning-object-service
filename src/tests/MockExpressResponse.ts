import { Response } from 'express';

/**
 * A Mock Response for use in Express apps.
 *
 * TODO: This is currently a placeholder to construct an ExpressResponder without an Express app.
 * This class is not implemented appropriately for testing endpoints that plan to respond over HTTP.
 *
 * @export
 * @class MockExpressResponse
 * @implements {Response}
 *
 * @author Sean Donnelly
 */
export class MockExpressResponse implements Response {
  body: any;
  headers: any;
  ok: any;
  statusText: any;
  url: any;
  redirected: any;
  clone: any;
  bodyUsed: any;
  arrayBuffer: any;
  blob: any;
  text: any;
  formData: any;

  send: (body?: any) => Response;
  json: (body?: any) => Response;
  jsonp: (body?: any) => Response;
  status(code: number): Response {
    throw new Error('Method not implemented.');
  }
  sendStatus(code: number): Response {
    throw new Error('Method not implemented.');
  }
  links(links: any): Response {
    throw new Error('Method not implemented.');
  }
  sendFile(path: string): void;
  sendFile(path: string, options: any): void;
  sendFile(path: string, fn: (err: Error) => void): void;
  sendFile(path: string, options: any, fn: (err: Error) => void): void;
  sendFile(path: any, options?: any, fn?: any) {
    throw new Error('Method not implemented.');
  }
  sendfile(path: string): void;
  sendfile(path: string, options: any): void;
  sendfile(path: string, fn: (err: Error) => void): void;
  sendfile(path: string, options: any, fn: (err: Error) => void): void;
  sendfile(path: any, options?: any, fn?: any) {
    throw new Error('Method not implemented.');
  }
  download(path: string): void;
  download(path: string, filename: string): void;
  download(path: string, fn: (err: Error) => void): void;
  download(path: string, filename: string, fn: (err: Error) => void): void;
  download(path: any, filename?: any, fn?: any) {
    throw new Error('Method not implemented.');
  }
  contentType(type: string): Response {
    throw new Error('Method not implemented.');
  }
  type(type: string): Response {
    throw new Error('Method not implemented.');
  }
  format(obj: any): Response {
    throw new Error('Method not implemented.');
  }
  attachment(filename?: string): Response {
    throw new Error('Method not implemented.');
  }
  set(field: any): Response;
  set(field: string, value?: string): Response;
  set(field: any, value?: any) {
    throw new Error('Method not implemented.');
  }
  header(field: any): Response;
  header(field: string, value?: string): Response;
  header(field: any, value?: any) {
    throw new Error('Method not implemented.');
  }
  headersSent: boolean;
  get(field: string): string {
    throw new Error('Method not implemented.');
  }
  clearCookie(name: string, options?: any): Response {
    throw new Error('Method not implemented.');
  }
  cookie(name: string, val: string, options: CookieOptions): Response;
  cookie(name: string, val: any, options: CookieOptions): Response;
  cookie(name: string, val: any): Response;
  cookie(name: any, val: any, options?: any) {
    throw new Error('Method not implemented.');
  }
  location(url: string): Response {
    throw new Error('Method not implemented.');
  }
  redirect(url: string): void;
  redirect(status: number, url: string): void;
  redirect(url: string, status: number): void;
  redirect(url: any, status?: any) {
    throw new Error('Method not implemented.');
  }
  render(view: string, options?: Object, callback?: (err: Error, html: string) => void): void;
  render(view: string, callback?: (err: Error, html: string) => void): void;
  render(view: any, options?: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  locals: any;
  charset: string;
  vary(field: string): Response {
    throw new Error('Method not implemented.');
  }
  app: Application;
  statusCode: number;
  statusMessage: string;
  assignSocket(socket: Socket): void {
    throw new Error('Method not implemented.');
  }
  detachSocket(socket: Socket): void {
    throw new Error('Method not implemented.');
  }
  writeContinue(callback?: () => void): void {
    throw new Error('Method not implemented.');
  }
  writeHead(statusCode: number, reasonPhrase?: string, headers?: OutgoingHttpHeaders): void;
  writeHead(statusCode: number, headers?: OutgoingHttpHeaders): void;
  writeHead(statusCode: any, reasonPhrase?: any, headers?: any) {
    throw new Error('Method not implemented.');
  }
  upgrading: boolean;
  chunkedEncoding: boolean;
  shouldKeepAlive: boolean;
  useChunkedEncodingByDefault: boolean;
  sendDate: boolean;
  finished: boolean;
  connection: Socket;
  setTimeout(msecs: number, callback?: () => void): this {
    throw new Error('Method not implemented.');
  }
  destroy(error: Error): void {
    throw new Error('Method not implemented.');
  }
  setHeader(name: string, value: string | number | string[]): void {
    throw new Error('Method not implemented.');
  }
  getHeader(name: string): string | number | string[] {
    throw new Error('Method not implemented.');
  }
  getHeaders(): OutgoingHttpHeaders {
    throw new Error('Method not implemented.');
  }
  getHeaderNames(): string[] {
    throw new Error('Method not implemented.');
  }
  hasHeader(name: string): boolean {
    throw new Error('Method not implemented.');
  }
  removeHeader(name: string): void {
    throw new Error('Method not implemented.');
  }
  addTrailers(headers: OutgoingHttpHeaders | [string, string][]): void {
    throw new Error('Method not implemented.');
  }
  flushHeaders(): void {
    throw new Error('Method not implemented.');
  }
  writable: boolean;
  _write(chunk: any, encoding: string, callback: (err?: Error) => void): void {
    throw new Error('Method not implemented.');
  }
  _writev?(chunks: { chunk: any; encoding: string; }[], callback: (err?: Error) => void): void {
    throw new Error('Method not implemented.');
  }
  _destroy(err: Error, callback: Function): void {
    throw new Error('Method not implemented.');
  }
  _final(callback: Function): void {
    throw new Error('Method not implemented.');
  }
  write(chunk: any, cb?: Function): boolean;
  write(chunk: any, encoding?: string, cb?: Function): boolean;
  write(chunk: any, encoding?: any, cb?: any) {
    throw new Error('Method not implemented.');
  }
  setDefaultEncoding(encoding: string): this {
    throw new Error('Method not implemented.');
  }
  end(): void;
  end(chunk: any, cb?: Function): void;
  end(chunk: any, encoding?: string, cb?: Function): void;
  end(chunk?: any, encoding?: any, cb?: any) {
    throw new Error('Method not implemented.');
  }
  cork(): void {
    throw new Error('Method not implemented.');
  }
  uncork(): void {
    throw new Error('Method not implemented.');
  }
  addListener(event: string, listener: (...args: any[]) => void): this;
  addListener(event: 'close', listener: () => void): this;
  addListener(event: 'drain', listener: () => void): this;
  addListener(event: 'error', listener: (err: Error) => void): this;
  addListener(event: 'finish', listener: () => void): this;
  addListener(event: 'pipe', listener: (src: internal.Readable) => void): this;
  addListener(event: 'unpipe', listener: (src: internal.Readable) => void): this;
  addListener(event: any, listener: any) {
    throw new Error('Method not implemented.');
  }
  emit(event: string | symbol, ...args: any[]): boolean;
  emit(event: 'close'): boolean;
  emit(event: 'drain', chunk: string | Buffer): boolean;
  emit(event: 'error', err: Error): boolean;
  emit(event: 'finish'): boolean;
  emit(event: 'pipe', src: internal.Readable): boolean;
  emit(event: 'unpipe', src: internal.Readable): boolean;
  emit(event: any, src?: any, ...rest?: any[]) {
    throw new Error('Method not implemented.');
  }
  on(event: string, listener: (...args: any[]) => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'drain', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'finish', listener: () => void): this;
  on(event: 'pipe', listener: (src: internal.Readable) => void): this;
  on(event: 'unpipe', listener: (src: internal.Readable) => void): this;
  on(event: any, listener: any) {
    throw new Error('Method not implemented.');
  }
  once(event: string, listener: (...args: any[]) => void): this;
  once(event: 'close', listener: () => void): this;
  once(event: 'drain', listener: () => void): this;
  once(event: 'error', listener: (err: Error) => void): this;
  once(event: 'finish', listener: () => void): this;
  once(event: 'pipe', listener: (src: internal.Readable) => void): this;
  once(event: 'unpipe', listener: (src: internal.Readable) => void): this;
  once(event: any, listener: any) {
    throw new Error('Method not implemented.');
  }
  prependListener(event: string, listener: (...args: any[]) => void): this;
  prependListener(event: 'close', listener: () => void): this;
  prependListener(event: 'drain', listener: () => void): this;
  prependListener(event: 'error', listener: (err: Error) => void): this;
  prependListener(event: 'finish', listener: () => void): this;
  prependListener(event: 'pipe', listener: (src: internal.Readable) => void): this;
  prependListener(event: 'unpipe', listener: (src: internal.Readable) => void): this;
  prependListener(event: any, listener: any) {
    throw new Error('Method not implemented.');
  }
  prependOnceListener(event: string, listener: (...args: any[]) => void): this;
  prependOnceListener(event: 'close', listener: () => void): this;
  prependOnceListener(event: 'drain', listener: () => void): this;
  prependOnceListener(event: 'error', listener: (err: Error) => void): this;
  prependOnceListener(event: 'finish', listener: () => void): this;
  prependOnceListener(event: 'pipe', listener: (src: internal.Readable) => void): this;
  prependOnceListener(event: 'unpipe', listener: (src: internal.Readable) => void): this;
  prependOnceListener(event: any, listener: any) {
    throw new Error('Method not implemented.');
  }
  removeListener(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: 'close', listener: () => void): this;
  removeListener(event: 'drain', listener: () => void): this;
  removeListener(event: 'error', listener: (err: Error) => void): this;
  removeListener(event: 'finish', listener: () => void): this;
  removeListener(event: 'pipe', listener: (src: internal.Readable) => void): this;
  removeListener(event: 'unpipe', listener: (src: internal.Readable) => void): this;
  removeListener(event: any, listener: any) {
    throw new Error('Method not implemented.');
  }
  pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean; }): T {
    throw new Error('Method not implemented.');
  }
  removeAllListeners(event?: string | symbol): this {
    throw new Error('Method not implemented.');
  }
  setMaxListeners(n: number): this {
    throw new Error('Method not implemented.');
  }
  getMaxListeners(): number {
    throw new Error('Method not implemented.');
  }
  listeners(event: string | symbol): Function[] {
    throw new Error('Method not implemented.');
  }
  eventNames(): (string | symbol)[] {
    throw new Error('Method not implemented.');
  }
  listenerCount(type: string | symbol): number {
    throw new Error('Method not implemented.');
  }
}

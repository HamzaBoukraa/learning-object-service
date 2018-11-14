export interface InMemoryStore {
  get(params: { key: string }): Promise<any>;
  set(params: {
    key: string;
    value: any;
    expiration?: number; // Expiration time in seconds
  }): Promise<void>;
  remove(params: { key: string }): Promise<void>;
}

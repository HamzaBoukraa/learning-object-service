export abstract class FileAccessIdentityDatastore {
   /**
    * This function is responsible for saving
    * file access identities. Storing these ids
    * allows the File Manager module to construct
    * file paths without rate limiting issues.
    */
    abstract insertFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string,
        fileAccessIdentity: string,
    }): Promise<void>;

   /**
    * This function is used by the File Manager module
    * when constructing file paths.
    */
    abstract findFileAccessIdentity(username: string): Promise<string>;

    /**
     * This operation should be performed when
     * a user's privileges are changed. Users with
     * different privileges will have ids with
     * different signatures.
     */
    abstract updateFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string,
        fileAccessIdentity: string,
    }): Promise<void>;
}

import * as bcrypt from 'bcrypt';

/*
 * TODO: pick a good number for this
 *       larger numbers make a slower but securer algorithm
 */
const saltRounds = 10;

/**
 * Generate a hash for the given password.
 * @param {string} pwd
 *
 * @return {string} the hash, concatenated with salt and round count
 */
export async function hash(pwd: string): Promise<string> {
    return bcrypt.hash(pwd, saltRounds);
}

/**
 * Test if the given password hashes to the given hash.
 * @param pwd
 * @param hash_
 *
 * @returns {boolean} true iff pwd hashes to hash
 */
export async function verify(pwd: string, hash_: string): Promise<boolean> {
    return bcrypt.compare(pwd, hash_);
}

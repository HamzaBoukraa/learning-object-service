import * as bcrypt from 'bcrypt';

import { HashInterface } from '../interfaces/hash.interface';

export class BcryptDriver implements HashInterface {
    constructor(public saltRounds: number) {}

    hash = async function(pwd: string): Promise<string> {
        return bcrypt.hash(pwd, this.saltRounds);
    };

    verify = async function(pwd: string, hash_: string): Promise<boolean> {
        return bcrypt.compare(pwd, hash_);
    };
}

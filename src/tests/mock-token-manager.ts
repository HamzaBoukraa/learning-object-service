import { UserToken } from '../types';
import 'dotenv/config';
import * as jwt from 'jsonwebtoken';
const Issuer = process.env.ISSUER;
const Key = process.env.KEY;
/**
 * Takes in a userToken with access-groups and uses that to generate a bearer token to be used in tests.
 *
 * @param user The user info we will use to generate a token
 */
export function generateToken(user: UserToken) {
    const payload = {
        username: user.username,
        name: user.name,
        email: user.email,
        organization: user.organization,
        emailVerified: user.emailVerified,
        accessGroups: user.accessGroups,
    };
    const options = {
        issuer: Issuer,
        expiresIn: 86400,
        audience: user.username,
    };
    const token = jwt.sign(payload, Key, options);
    return token;
}

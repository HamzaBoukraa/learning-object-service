import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

export async function enforceWhitelist (username: string) {
    try {
        const response = await fetch(process.env.WHITELISTURL);
        const object = await response.json();
        const whitelist: string[] = object.whitelist;
        if (whitelist.indexOf(username) !== -1) {
          return true;
        } else {
          return false;
        }
      } catch (e) {
          return false;
      }
}

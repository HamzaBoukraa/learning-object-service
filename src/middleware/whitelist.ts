import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

export const enforceWhitelist = async (req, res, next) => {
    let user = req.user;

    try {
        const response = await fetch(process.env.WHITELISTURL);
        const object = await response.json();
        const whitelist: string[] = object.whitelist;
        const username = user.username;
        if (whitelist.includes(username)) {
          next();
        } else {
            res.status(401).send('Invalid download access!');
        }
      } catch (e) {
            res.status(401).send('Invalid download access!');
      }
};

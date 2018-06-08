import * as jwt from 'jsonwebtoken';

/**
 * Accepts a JWT and verifies that the token has been properly issued
 *
 * @param token the JWT as a string
 * @param callback the function to execute after verification
 */
export function verifyJWT(
  token: string,
  res: any,
  callback: Function
): boolean {
  try {
    const decoded = jwt.verify(token, process.env.KEY, {});

    if (typeof callback === 'function') {
      callback(status, decoded);
    }

    return true;
  } catch (error) {
    return false;
  }
}

export function generateServiceToken() {
  const payload = {
    SERVICE_KEY: process.env.SERVICE_KEY,
  };
  const options = {
    issuer: process.env.ISSUER,
    expiresIn: 86400,
    audience: 'https://clark.center'
  };
  return jwt.sign(payload, process.env.KEY, options);
}

export function decode(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.KEY,
      {
        issuer: process.env.ISSUER,
      },
      (err: any, decoded: any) => {
        err ? reject(err) : resolve(decoded);
      },
    );
  });
}

import * as https from 'https';

export function fetchFile(url: string, filename: string) {
  return new Promise((resolve, reject) => {
    https.get(url)
      .on('response', (response) => {
        response.pause();
        resolve({ fileStream: response, filename});
      });
  });
}

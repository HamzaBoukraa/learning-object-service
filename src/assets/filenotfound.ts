/**
 * Creates an HTML document declaring that the file was not found.
 *
 * @param redirectUrl the URL to send the user to
 */
export function fileNotFound(redirectUrl: string) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>File Not Found</title>
    </head>
    <body>
      <div><h1>File Not Found</h1></div>
      <div>
        <p>
          The requested file does not exist.
          <br/>
          <br/>
          You can find the latest materials for this learning object <a href="${redirectUrl}">here.</a>
        </p>
      </div>
    </body>
  </html>
  `;
}

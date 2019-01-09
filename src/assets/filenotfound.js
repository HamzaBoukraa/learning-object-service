"use strict";
exports.__esModule = true;
/**
 * Creates an HTML document declaring that the file was not found.
 *
 * @param redirectUrl the URL to send the user to
 */
function fileNotFound(redirectUrl) {
    return "\n  <!DOCTYPE html>\n  <html>\n    <head>\n      <meta charset=\"UTF-8\">\n      <title>File Not Found</title>\n    </head>\n    <body>\n      <div><h1>File Not Found</h1></div>\n      <div>\n        <p>\n          The requested file does not exist.\n          <br/>\n          <br/>\n          You can find the latest materials for this learning object <a href=\"" + redirectUrl + "\">here.</a>\n        </p>\n      </div>\n    </body>\n  </html>\n  ";
}
exports.fileNotFound = fileNotFound;

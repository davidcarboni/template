// This function enables website content to be accessed without requiring a .html file extension
// It will map e.g. /privacy to /privacy.html

// See also https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-example-code.html

function handler(event) {
  var request = event.request;

  // Trim trailing slash
  if (request.uri.length > 1 && request.uri.endsWith('/')) {
    request.uri = request.uri.slice(0, -1);
  }

  // html pages - don't rewrite for root (/) or static content (i.e. anything with a file extension)
  if (request.uri !== '/' && request.uri.indexOf('.') === -1) {
    request.uri = `${request.uri}.html`;
  }

  return request;
}

const security = require('../utils/security');

module.exports = (request, response, next) => {
  const signature = request.get('x-twitter-webhooks-signature');
  const rawBody = request.rawBody;
  if (!signature || !rawBody) {
    response.status(401).send('Unauthorized');
    return;
  }

  const body = Buffer.from(request.rawBody).toString();
  const expectedHash = `sha256=${security.hash(body)}`;
  if (signature !== expectedHash) {
    response.status(403).send('Forbidden');
    return;
  }
  next();
}
const security = require('../utils/security');

module.exports = (request, response) => {
  try {
    const responseToken = security.hash(request.query.crc_token);
    response.status(200).send({ response_token: `sha256=${responseToken}` });
  } catch (error) {
    response.status(400).send({ response_token: null });
  }
}
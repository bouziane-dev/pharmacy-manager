const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("Server auth configuration is incomplete");
  }
  return process.env.JWT_SECRET;
}

function signAuthToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: options.expiresIn || "1d",
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};

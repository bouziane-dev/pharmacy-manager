function hasForbiddenMongoKey(key) {
  return key.startsWith("$") || key.includes(".");
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      if (hasForbiddenMongoKey(key)) continue;
      out[key] = sanitizeValue(nested);
    }
    return out;
  }

  if (typeof value === "string") {
    // Remove null bytes and control chars except tab/newline/carriage return.
    return value.replace(/\u0000/g, "").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  }

  return value;
}

function sanitizeRequest(req, _res, next) {
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
}

module.exports = sanitizeRequest;

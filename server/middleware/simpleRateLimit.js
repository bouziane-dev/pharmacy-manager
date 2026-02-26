function simpleRateLimit({ windowMs = 60_000, max = 120 } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const entry = hits.get(key);

    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { count: 1, start: now });
      return next();
    }

    if (entry.count >= max) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    entry.count += 1;
    return next();
  };
}

module.exports = simpleRateLimit;

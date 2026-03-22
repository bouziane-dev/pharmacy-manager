function isAuthDebugEnabled() {
  return String(process.env.AUTH_DEBUG_LOGS || "").toLowerCase() === "true";
}

function getClientIp(req) {
  const expressIp = req.ip || req.socket?.remoteAddress;
  if (typeof expressIp === "string" && expressIp.trim().length > 0) {
    return expressIp.trim();
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) {
      return firstHop;
    }
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

function getRateLimitKey(req) {
  const userAgent = String(req.headers["user-agent"] || "unknown")
    .trim()
    .slice(0, 120);

  // Include UA with IP to reduce collisions for shared mobile carrier NAT IPs.
  return `${getClientIp(req)}::${userAgent}`;
}

function simpleRateLimit({ windowMs = 60_000, max = 120 } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = getRateLimitKey(req);
    const entry = hits.get(key);

    for (const [entryKey, value] of hits.entries()) {
      if (now - value.start > windowMs) {
        hits.delete(entryKey);
      }
    }

    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { count: 1, start: now });
      return next();
    }

    if (entry.count >= max) {
      const remainingMs = Math.max(0, windowMs - (now - entry.start));
      const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));

      if (isAuthDebugEnabled()) {
        console.warn("[rate-limit] blocked request", {
          method: req.method,
          path: req.originalUrl || req.url,
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"] || null,
          max,
          windowMs,
        });
      }

      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    entry.count += 1;
    return next();
  };
}

module.exports = simpleRateLimit;

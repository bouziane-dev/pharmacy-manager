const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");

const router = express.Router();

function buildRedirectUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    (error, user) => {
      if (error || !user) {
        if (process.env.FRONTEND_AUTH_FAILURE_URL) {
          const failureUrl = buildRedirectUrl(process.env.FRONTEND_AUTH_FAILURE_URL, {
            error: "auth_failed",
          });
          return res.redirect(302, failureUrl);
        }

        return res.status(401).json({
          error: "Authentication failed",
        });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          error: "Server auth configuration is incomplete",
        });
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      const safeUser = {
        id: user._id,
        googleId: user.googleId,
        email: user.email,
        displayName: user.displayName,
        picture: user.picture,
        onboardingCompleted: user.onboardingCompleted,
        primaryRole: user.primaryRole,
        subscriptionActive: user.subscriptionActive,
      };

      const onboardingRequired = !user.onboardingCompleted;

      if (process.env.FRONTEND_AUTH_SUCCESS_URL) {
        const encodedUser = Buffer.from(JSON.stringify(safeUser)).toString(
          "base64url"
        );
        const successUrl = buildRedirectUrl(process.env.FRONTEND_AUTH_SUCCESS_URL, {
          token,
          user: encodedUser,
          onboardingRequired: onboardingRequired ? "true" : "false",
        });
        return res.redirect(302, successUrl);
      }

      return res.status(200).json({
        token,
        user: safeUser,
        onboardingRequired,
      });
    }
  )(req, res, next);
});

module.exports = router;

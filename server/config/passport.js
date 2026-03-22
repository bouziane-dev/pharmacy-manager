const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
];

const missingVars = requiredEnvVars.filter((name) => !process.env[name]);
const placeholderVars = requiredEnvVars.filter((name) =>
  String(process.env[name]).startsWith("replace-with-")
);

if (missingVars.length > 0 || placeholderVars.length > 0) {
  throw new Error(
    `Invalid Google OAuth environment variable(s): ${[
      ...missingVars,
      ...placeholderVars,
    ].join(", ")}`
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile?.emails?.[0]?.value?.toLowerCase();

        if (!email || !profile.id) {
          return done(new Error("Google profile is missing required fields"));
        }

        // Login is keyed by googleId. If not found, create a new standalone user.
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email,
            name: profile.displayName || email,
            displayName: profile.displayName || "Google User",
            picture: profile?.photos?.[0]?.value || "",
            role: "owner",
            isActive: true,
          });
        } else {
          user.name = user.name || user.displayName || profile.displayName || email;
          user.displayName = profile.displayName || user.displayName || user.name;
          user.picture = profile?.photos?.[0]?.value || user.picture || "";
          user.role = user.role || "owner";
          user.isActive = user.isActive !== false;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;

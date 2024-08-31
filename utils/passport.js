const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_SSO_CLIENT_ID,
        clientSecret: process.env.GOOGLE_SSO_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/api/auth/google/callback",
        passReqToCallback: true,
    },

    async function (request, accessToken, refreshToken, profile, done){
        // write algorithm here...
        // check i user exisits... using emal or create one then login user..

        return done(null, profile);
    }
)

);

passport.serializeUser(function (user, done){
    done(null, user);
});

// function to deserialize a user/profile object into the session
passport.deserializeUser(function (user, done) {
    done(null, user);
  });

// module.exports = passport;

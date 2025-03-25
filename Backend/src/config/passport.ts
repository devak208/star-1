import * as passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { prisma } from './db';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails && profile.emails[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Provide a default password for Google users
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email,
              provider: "google",
              password: "", // Default value; you can generate a random string if preferred.
            },
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error as Error, null);
  }
});

export default passport;

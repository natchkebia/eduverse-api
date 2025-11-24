import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    if (!profile.emails || profile.emails.length === 0) {
      throw new UnauthorizedException('Google account has no email');
    }

    const user = {
      provider: profile.provider,
      email: profile.emails[0].value,
      name:
        profile.name?.givenName ||
        profile._json?.given_name ||
        profile.displayName ||
        'User',

      surname: profile.name?.familyName || profile._json?.family_name || null,

      avatar: profile.photos?.[0]?.value || profile._json?.picture || null,
    };

    done(null, user);
  }
}

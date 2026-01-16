import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/redirect';

    // ✅ თუ env არ გაქვს (dev-ში), Nest არ ჩამოვარდება
    super(
      clientID && clientSecret
        ? {
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'profile'],
          }
        : {
            clientID: 'disabled',
            clientSecret: 'disabled',
            callbackURL: 'disabled',
            scope: [],
          },
    );
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
        (profile as any)?._json?.given_name ||
        profile.displayName ||
        'User',
      surname:
        profile.name?.familyName || (profile as any)?._json?.family_name || null,
      avatar: profile.photos?.[0]?.value || (profile as any)?._json?.picture || null,
    };

    done(null, user);
  }
}

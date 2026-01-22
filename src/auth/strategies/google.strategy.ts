import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly isEnabled: boolean;

  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/redirect';

    const enabled = Boolean(clientID && clientSecret);

    super(
      enabled
        ? {
            clientID: clientID!,
            clientSecret: clientSecret!,
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

    this.isEnabled = enabled;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    // ✅ თუ env არ გაქვს — არ ვუშვებთ საერთოდ
    if (!this.isEnabled) {
      throw new UnauthorizedException('Google auth is disabled');
    }

    if (!profile.emails || profile.emails.length === 0) {
      throw new UnauthorizedException('Google account has no email');
    }

    const user = {
      provider: 'google',
      email: profile.emails[0].value,
      name:
        profile.name?.givenName ||
        (profile as any)?._json?.given_name ||
        profile.displayName ||
        'User',
      surname:
        profile.name?.familyName || (profile as any)?._json?.family_name || null,
      avatar:
        profile.photos?.[0]?.value || (profile as any)?._json?.picture || null,
    };

    done(null, user);
  }
}

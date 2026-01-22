import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly isEnabled: boolean;

  constructor() {
    const clientID = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const callbackURL =
      process.env.FACEBOOK_CALLBACK_URL ||
      'http://localhost:3000/auth/facebook/redirect';

    const enabled = Boolean(clientID && clientSecret);
    super(
      enabled
        ? {
            clientID: clientID!,
            clientSecret: clientSecret!,
            callbackURL,
            profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
          }
        : {
            clientID: 'disabled',
            clientSecret: 'disabled',
            callbackURL: 'disabled',
            profileFields: [],
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
      throw new UnauthorizedException('Facebook auth is disabled');
    }

    if (!profile.emails || profile.emails.length === 0) {
      throw new UnauthorizedException('Facebook account has no email');
    }

    const user = {
      provider: 'facebook',
      email: profile.emails[0].value,
      name: profile.name?.givenName || 'User',
      surname: profile.name?.familyName || null,
      avatar: profile.photos?.[0]?.value || null,
    };

    done(null, user);
  }
}

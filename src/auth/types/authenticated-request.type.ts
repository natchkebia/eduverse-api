import { Request } from 'express';
import { Role } from '@prisma/client';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    role: Role;
    name: string;
  };
};

export type OptionalAuthenticatedRequest = Request & {
  user?: AuthenticatedRequest['user'] | null;
};

export type OAuthRequest = Request & {
  user: {
    email: string;
    name: string;
    surname?: string | null;
    avatar?: string | null;
    provider: string;
  };
};

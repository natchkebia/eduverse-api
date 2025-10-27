import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) return false;

    const token = authHeader.split(' ')[1];
    if (!token) return false;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
      request.user = decoded; // 👈 აქ userId ჩავარდება req.user.userId-ში
      return true;
    } catch (err) {
      console.error('❌ Invalid token:', err);
      return false;
    }
  }
}

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const PUBLIC_PATHS = ['/auth'];
    if (PUBLIC_PATHS.some((p) => req.path.startsWith(p))) return next();
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedException();
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      req['user'] = payload;
      next();
    } catch {
      throw new UnauthorizedException();
    }
  }
}

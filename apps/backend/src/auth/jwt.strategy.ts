import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
  type JwtFromRequestFunction,
} from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { User } from '../users/user.entity';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * SEC-002: prefer the HttpOnly `hp_token` cookie set by /auth/login,
 * fall back to `Authorization: Bearer` for CI / curl / mobile clients.
 * Browser sessions therefore never expose the JWT to JavaScript.
 *
 * We parse the raw Cookie header here instead of depending on a
 * cookie-parser middleware in the request pipeline, which keeps the
 * strategy self-contained and avoids type coupling with express's
 * `Request.cookies` (which is `any` by default).
 */
const AUTH_COOKIE_NAME = 'hp_token';
const fromCookie: JwtFromRequestFunction = (req: Request) => {
  const raw = req.headers?.cookie;
  if (typeof raw !== 'string' || raw.length === 0) return null;
  for (const pair of raw.split(';')) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    if (name !== AUTH_COOKIE_NAME) continue;
    const value = pair.slice(eq + 1).trim();
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    // 回库校验：用户仍存在，且 token 是在最后一次改密之后签发的
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    if (user.passwordChangedAt) {
      const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (payload.iat < changedAtSec) {
        throw new UnauthorizedException('密码已变更，请重新登录');
      }
    }
    return { sub: user.id, username: user.username, role: user.role };
  }
}

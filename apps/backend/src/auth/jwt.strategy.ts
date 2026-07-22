import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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

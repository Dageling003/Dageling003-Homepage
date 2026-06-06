import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { User } from '../users/user.entity'
import { LoginDto } from './dto/login.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(dto: LoginDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username: dto.username } })
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    return user
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto)
    const payload = { sub: user.id, username: user.username, role: user.role }
    return {
      accessToken: this.jwtService.sign(payload),
      username: user.username,
    }
  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在')
    const { password, ...profile } = user
    return profile
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在')

    const isOldValid = await bcrypt.compare(dto.oldPassword, user.password)
    if (!isOldValid) throw new BadRequestException('旧密码不正确')

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与旧密码相同')
    }

    user.password = await bcrypt.hash(dto.newPassword, 10)
    await this.usersRepository.save(user)
    return { message: '密码修改成功' }
  }

  async ensureAdminExists() {
    const count = await this.usersRepository.count()
    if (count === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD
      if (!defaultPassword) {
        throw new Error(
          '[AuthService] No admin user exists and DEFAULT_ADMIN_PASSWORD is not set. ' +
            'Please set it in your environment (or .env) before starting the backend, ' +
            'e.g. `DEFAULT_ADMIN_PASSWORD=$(openssl rand -base64 24)`.',
        )
      }
      if (defaultPassword.length < 12) {
        throw new Error(
          '[AuthService] DEFAULT_ADMIN_PASSWORD is too short (minimum 12 characters). ' +
            'Please use a stronger password or generate one with `openssl rand -base64 24`.',
        )
      }
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)
      const admin = this.usersRepository.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      })
      await this.usersRepository.save(admin)
      // 出于安全考虑，绝不在日志中输出明文口令。
      // 部署后请立即登录后台并修改默认密码。
      console.log('[AuthService] Default admin user "admin" has been created. Rotate the password immediately.')
    }
  }
}

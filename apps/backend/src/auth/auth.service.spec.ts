import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../common/mail.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: Partial<User> = {
    id: 1,
    username: 'admin',
    password: '',
    role: 'admin',
  };

  const mockUsersRepo = {
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockResetTokenRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockMailService = {
    isSmtpEnabled: jest.fn().mockReturnValue(false),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeAll(async () => {
    mockUser.password = await bcrypt.hash('password123456', 12);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: mockResetTokenRepo,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  //  validateUser
  // ============================================================
  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.validateUser({
        username: 'admin',
        password: 'password123456',
      });
      expect(result.username).toBe('admin');
    });

    it('should throw UnauthorizedException for wrong username', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.validateUser({ username: 'wrong', password: 'password123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        service.validateUser({ username: 'admin', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================================
  //  login
  // ============================================================
  describe('login', () => {
    it('should return accessToken and username', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.login({
        username: 'admin',
        password: 'password123456',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result.username).toBe('admin');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  // ============================================================
  //  changePassword
  // ============================================================
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUsersRepo.save.mockResolvedValue(true);
      const result = await service.changePassword(1, {
        oldPassword: 'password123456',
        newPassword: 'newpassword1234',
      });
      expect(result.message).toContain('成功');
    });

    it('should throw if old password is wrong', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ ...mockUser });
      await expect(
        service.changePassword(1, {
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword1234',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if new password same as old', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ ...mockUser });
      await expect(
        service.changePassword(1, {
          oldPassword: 'password123456',
          newPassword: 'password123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  //  requestPasswordReset
  // ============================================================
  describe('requestPasswordReset', () => {
    it('should always return success message (anti-enumeration)', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      const result = await service.requestPasswordReset('nonexistent');
      expect(result.message).toContain('重置链接已发送');
    });

    it('should create token and attempt email for existing user', async () => {
      mockUsersRepo.findOne.mockResolvedValue(mockUser);
      mockResetTokenRepo.save.mockResolvedValue(true);
      const result = await service.requestPasswordReset('admin');
      expect(result.message).toContain('重置链接已发送');
      expect(mockResetTokenRepo.create).toHaveBeenCalled();
    });
  });

  // ============================================================
  //  resetPassword
  // ============================================================
  describe('resetPassword', () => {
    it('should throw for non-existent token', async () => {
      mockResetTokenRepo.findOne.mockResolvedValue(null);
      await expect(
        service.resetPassword('invalid-token', 'newpassword1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for already used token', async () => {
      mockResetTokenRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      });
      await expect(
        service.resetPassword('used-token', 'newpassword1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for expired token', async () => {
      mockResetTokenRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        usedAt: null,
        expiresAt: new Date(Date.now() - 60000),
      });
      await expect(
        service.resetPassword('expired-token', 'newpassword1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password for valid token', async () => {
      mockResetTokenRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
      });
      mockUsersRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUsersRepo.save.mockResolvedValue(true);
      mockResetTokenRepo.save.mockResolvedValue(true);
      const result = await service.resetPassword(
        'valid-token',
        'newpassword1234',
      );
      expect(result.message).toContain('成功');
    });
  });

  // ============================================================
  //  hasAnyUser
  // ============================================================
  describe('hasAnyUser', () => {
    it('should return true when users exist', async () => {
      mockUsersRepo.count.mockResolvedValue(1);
      expect(await service.hasAnyUser()).toBe(true);
    });

    it('should return false when no users', async () => {
      mockUsersRepo.count.mockResolvedValue(0);
      expect(await service.hasAnyUser()).toBe(false);
    });
  });
});

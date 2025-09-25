import { UserService } from '../../services/UserService';
import { AuthService } from '../../services/AuthService';
import { User } from '../../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock external dependencies
jest.mock('../../models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUser: any;

  beforeEach(() => {
    authService = new AuthService();
    mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword',
      isActive: true,
      emailVerified: true,
      comparePassword: jest.fn(),
      save: jest.fn(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Mock User.create
      (User.create as jest.Mock).mockResolvedValue({
        ...userData,
        password: 'hashedPassword',
        _id: 'newUser123',
      });

      const result = await authService.registerUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(User.create).toHaveBeenCalledWith({
        ...userData,
        password: 'hashedPassword',
        verificationToken: expect.any(String),
      });
      expect(result).toEqual(expect.objectContaining({
        email: 'newuser@example.com',
        _id: 'newUser123',
      }));
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.registerUser(userData))
        .rejects.toThrow('User already exists');
    });

    it('should throw error for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      await expect(authService.registerUser(userData))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
      };

      await expect(authService.registerUser(userData))
        .rejects.toThrow('Password is too weak');
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const result = await authService.loginUser(loginData);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123!');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toEqual({
        token: 'jwt-token',
        user: expect.objectContaining({
          id: mockUser._id,
          email: mockUser.email,
        }),
      });
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(authService.loginUser(loginData))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.loginUser(loginData))
        .rejects.toThrow('User not found');
    });

    it('should throw error for inactive user', async () => {
      const loginData = {
        email: 'inactive@example.com',
        password: 'Password123!',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      (User.findOne as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(authService.loginUser(loginData))
        .rejects.toThrow('Account is inactive');
    });

    it('should throw error for unverified email', async () => {
      const loginData = {
        email: 'unverified@example.com',
        password: 'Password123!',
      };

      const unverifiedUser = { ...mockUser, emailVerified: false };
      (User.findOne as jest.Mock).mockResolvedValue(unverifiedUser);

      await expect(authService.loginUser(loginData))
        .rejects.toThrow('Email not verified');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      const token = 'valid-jwt-token';
      const decodedPayload = { userId: 'user123', email: 'test@example.com' };

      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(decodedPayload);
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken(token))
        .rejects.toThrow('Invalid token');
    });

    it('should throw error if user not found', async () => {
      const token = 'valid-token';
      const decodedPayload = { userId: 'nonexistent', email: 'test@example.com' };

      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.verifyToken(token))
        .rejects.toThrow('User not found');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const newToken = 'new-jwt-token';

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(newToken);

      const result = await authService.refreshToken(refreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_SECRET);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(result).toEqual({ token: newToken });
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(authService.refreshToken(refreshToken))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123!',
        newPassword: 'newPassword123!',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockUser.save.mockResolvedValue({ ...mockUser, password: 'newHashedPassword' });

      const result = await authService.changePassword('user123', passwordData);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('oldPassword123!');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123!', 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: mockUser._id,
        email: mockUser.email,
      }));
    });

    it('should throw error for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(authService.changePassword('user123', passwordData))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue({
        ...mockUser,
        passwordResetToken: 'reset-token',
        passwordResetExpires: new Date(Date.now() + 3600000),
      });

      const result = await authService.requestPasswordReset(email);

      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        message: 'Password reset email sent',
        email: 'test@example.com',
      }));
    });

    it('should throw error for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.requestPasswordReset(email))
        .rejects.toThrow('User not found');
    });
  });
});
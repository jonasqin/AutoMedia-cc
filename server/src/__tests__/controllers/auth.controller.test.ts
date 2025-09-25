import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import { AuthService } from '../../services/AuthService';

// Mock the AuthService
jest.mock('../../services/AuthService');

describe('Auth Controller', () => {
  let app: express.Application;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    (AuthService as jest.Mock).mockImplementation(() => mockAuthService);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const mockResponse = {
        user: {
          id: 'newUser123',
          email: 'newuser@example.com',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        token: 'jwt-token',
      };

      mockAuthService.registerUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
      };

      mockAuthService.registerUser.mockRejectedValue(new Error('User already exists'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockResponse = {
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
        token: 'jwt-token',
      };

      mockAuthService.loginUser.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginData);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.loginUser.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 400 for missing fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockResponse = {
        token: 'new-jwt-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid refresh token');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';
      const mockResponse = {
        message: 'Password reset email sent',
        email: 'test@example.com',
      };

      mockAuthService.requestPasswordReset.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(email);
    });

    it('should return 404 for non-existent email', async () => {
      const email = 'nonexistent@example.com';

      mockAuthService.requestPasswordReset.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123!',
        newPassword: 'newPassword123!',
      };

      const mockResponse = {
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
      };

      mockAuthService.changePassword.mockResolvedValue(mockResponse);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'user123')
        .send(passwordData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('user123', passwordData);
    });

    it('should return 401 without authentication', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123!',
        newPassword: 'newPassword123!',
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!',
      };

      mockAuthService.changePassword.mockRejectedValue(new Error('Current password is incorrect'));

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'user123')
        .send(passwordData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Current password is incorrect');
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify token successfully', async () => {
      const token = 'valid-jwt-token';
      const mockResponse = {
        userId: 'user123',
        email: 'test@example.com',
      };

      mockAuthService.verifyToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(token);
    });

    it('should return 401 for invalid token', async () => {
      const token = 'invalid-token';

      mockAuthService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
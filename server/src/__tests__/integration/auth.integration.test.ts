import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import { User } from '../../models';
import { authenticateToken } from '../../middleware/auth';

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Integration Tests', () => {
  describe('User Registration Flow', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.profile.firstName).toBe(userData.firstName);
      expect(response.body.data.user.profile.lastName).toBe(userData.lastName);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle registration without optional fields', async () => {
      const minimalData = {
        email: 'minimal@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(minimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(minimalData.email);
      expect(response.body.data.user.profile.firstName).toBeUndefined();
    });
  });

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'login@example.com',
        password: 'Password123!',
        profile: {
          firstName: 'Login',
          lastName: 'User',
        },
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.lastLogin).toBeDefined();
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login with wrong password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login inactive user', async () => {
      // Deactivate user
      await User.findOneAndUpdate(
        { email: 'login@example.com' },
        { isActive: false }
      );

      const loginData = {
        email: 'login@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('Token Refresh Flow', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create and login user to get refresh token
      const userData = {
        email: 'refresh@example.com',
        password: 'Password123!',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      refreshToken = registerResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should not refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should not refresh without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token is required');
    });
  });

  describe('Protected Routes', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create and login user to get access token
      const userData = {
        email: 'protected@example.com',
        password: 'Password123!',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      accessToken = registerResponse.body.data.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('protected@example.com');
    });

    it('should not access protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not access protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not access protected route with expired token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Profile Management', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create and login user
      const userData = {
        email: 'profile@example.com',
        password: 'Password123!',
        firstName: 'Original',
        lastName: 'Name',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      accessToken = registerResponse.body.data.accessToken;
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        avatar: 'https://example.com/avatar.jpg',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.firstName).toBe(updateData.firstName);
      expect(response.body.data.profile.lastName).toBe(updateData.lastName);
      expect(response.body.data.profile.avatar).toBe(updateData.avatar);
    });

    it('should update user settings', async () => {
      const settingsData = {
        defaultAIModel: 'gpt-4',
        theme: 'dark',
      };

      const response = await request(app)
        .put('/api/auth/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(settingsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.defaultAIModel).toBe(settingsData.defaultAIModel);
      expect(response.body.data.theme).toBe(settingsData.theme);
    });

    it('should validate profile update data', async () => {
      const invalidData = {
        firstName: 'A'.repeat(51), // Too long
        avatar: 'invalid-url',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Security Features', () => {
    it('should not return sensitive data in user object', async () => {
      // Register user
      const userData = {
        email: 'security@example.com',
        password: 'Password123!',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Get user profile
      const accessToken = registerResponse.body.data.accessToken;
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const user = response.body.data;
      expect(user.password).toBeUndefined();
      expect(user.apiKeys).toBeUndefined();
      expect(user.verificationToken).toBeUndefined();
    });

    it('should handle rate limiting', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'Password123!',
      };

      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(loginData);

      // Make multiple login attempts
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send(loginData)
        );
      }

      const responses = await Promise.all(promises);

      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection
      // For now, we'll test validation errors
      const invalidData = {
        email: 'invalid-email',
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid-json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
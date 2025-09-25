import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { User } from '../models';
import { cacheData, getCachedData, deleteCache } from '../config/redis';
import { AuthRequest } from '../types';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').optional().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName').optional().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Create new user
  const user = new User({
    email,
    password,
    profile: {
      firstName,
      lastName,
    },
  });

  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.email);

  // Cache user data
  await cacheData(`user:${user._id}`, user.toObject(), 3600);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    },
  });
}));

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated',
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.email);

  // Cache user data
  await cacheData(`user:${user._id}`, user.toObject(), 3600);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
        lastLogin: user.lastLogin,
      },
      accessToken,
      refreshToken,
    },
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id.toString(), user.email);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Try to get from cache first
  const cachedUser = await getCachedData(`user:${userId}`);
  if (cachedUser) {
    const { password, apiKeys, ...userWithoutSensitiveData } = cachedUser;
    return res.json({
      success: true,
      data: userWithoutSensitiveData,
    });
  }

  // Get from database
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Cache user data
  await cacheData(`user:${userId}`, user.toObject(), 3600);

  res.json({
    success: true,
    data: user,
  });
}));

// Update profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().isLength({ max: 50 }),
  body('lastName').optional().isLength({ max: 50 }),
  body('avatar').optional().isURL(),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { firstName, lastName, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.avatar': avatar,
      },
    },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Clear cache
  await deleteCache(`user:${userId}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
}));

// Update settings
router.put('/settings', authenticateToken, [
  body('defaultAIModel').optional().isIn(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-2', 'claude-instant', 'gemini-pro', 'gemini-1.5-pro', 'deepseek-chat']),
  body('defaultAgent').optional().isString(),
  body('theme').optional().isIn(['light', 'dark', 'auto']),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { defaultAIModel, defaultAgent, theme } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'settings.defaultAIModel': defaultAIModel,
        'settings.defaultAgent': defaultAgent,
        'settings.theme': theme,
      },
    },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Clear cache
  await deleteCache(`user:${userId}`);

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: user.settings,
  });
}));

// Logout
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Clear cache
  await deleteCache(`user:${userId}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

export default router;
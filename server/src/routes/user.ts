import express from 'express';
const router = express.Router();

// This is a placeholder route file for user routes
// The actual user routes are implemented in the auth.ts file

// Health check for user service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
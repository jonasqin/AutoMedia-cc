import express from 'express';
const router = express.Router();

// This is a placeholder route file for agents
// The actual agent routes are implemented in the ai.ts file

// Health check for agent service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Agent service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
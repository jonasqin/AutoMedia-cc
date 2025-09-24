import { Router } from 'express';
import { AIEnhancementController } from '../controllers/AIEnhancementController';
import { authenticate } from '../middleware/auth';

const router = Router();
const aiEnhancementController = new AIEnhancementController();

// AI enhancement management
router.post('/', authenticate, aiEnhancementController.createAIEnhancement);
router.get('/', authenticate, aiEnhancementController.getAIEnhancements);
router.get('/stats', authenticate, aiEnhancementController.getAIEnhancementStats);
router.get('/roadmap', authenticate, aiEnhancementController.getAIEnhancementRoadmap);
router.get('/:id', authenticate, aiEnhancementController.getAIEnhancement);
router.put('/:id', authenticate, aiEnhancementController.updateAIEnhancement);
router.delete('/:id', authenticate, aiEnhancementController.deleteAIEnhancement);

// Deployment management
router.post('/:id/deploy', authenticate, aiEnhancementController.deployAIEnhancement);

// AI models and features
router.get('/provider/:provider/models', authenticate, aiEnhancementController.getAIModelsByProvider);
router.get('/category/:category/features', authenticate, aiEnhancementController.getAIFeaturesByCategory);

// Cost and compliance
router.post('/:id/cost-estimate', authenticate, aiEnhancementController.getCostEstimate);
router.get('/:id/compliance/:regulation', authenticate, aiEnhancementController.checkCompliance);

// Performance and metrics
router.get('/:id/performance', authenticate, aiEnhancementController.getAIPerformanceMetrics);

// Capabilities management
router.get('/:id/capabilities', authenticate, aiEnhancementController.getAICapabilities);
router.post('/:id/capabilities/:capabilityName', authenticate, aiEnhancementController.toggleAICapability);

export default router;
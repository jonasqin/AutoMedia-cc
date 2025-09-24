import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();
const subscriptionController = new SubscriptionController();

// Subscription management routes
router.post('/', authenticate, subscriptionController.createOrGetSubscription);
router.get('/', authenticate, subscriptionController.getSubscription);
router.get('/stats', authenticate, subscriptionController.getSubscriptionStats);

// Plan management
router.put('/upgrade', authenticate, subscriptionController.upgradeSubscription);
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);
router.post('/pause', authenticate, subscriptionController.pauseSubscription);
router.post('/resume', authenticate, subscriptionController.resumeSubscription);

// Payment and billing
router.get('/billing', authenticate, subscriptionController.getBillingInfo);
router.put('/payment', authenticate, subscriptionController.updatePaymentMethod);
router.get('/history', authenticate, subscriptionController.getSubscriptionHistory);

// Usage and features
router.get('/usage', authenticate, subscriptionController.getUsage);
router.post('/usage', authenticate, subscriptionController.processUsage);
router.get('/features/:feature', authenticate, subscriptionController.checkFeatureAccess);

// Addon management
router.post('/addons', authenticate, subscriptionController.addAddon);
router.delete('/addons/:addonId', authenticate, subscriptionController.removeAddon);

export default router;
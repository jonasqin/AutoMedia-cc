import { Router } from 'express';
import { LaunchController } from '../controllers/LaunchController';
import { authenticate } from '../middleware/auth';

const router = Router();
const launchController = new LaunchController();

// Launch configuration routes
router.post('/', authenticate, launchController.createLaunchConfig);
router.get('/', authenticate, launchController.getLaunchConfigs);
router.get('/dashboard', authenticate, launchController.getLaunchDashboard);
router.get('/:id', authenticate, launchController.getLaunchConfig);
router.put('/:id', authenticate, launchController.updateLaunchConfig);
router.delete('/:id', authenticate, launchController.deleteLaunchConfig);

// Launch execution routes
router.post('/:id/phase', authenticate, launchController.executeLaunchPhase);
router.get('/:id/metrics', authenticate, launchController.getLaunchMetrics);

export default router;
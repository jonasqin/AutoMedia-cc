import { Router } from 'express';
import { InternationalController } from '../controllers/InternationalController';
import { authenticate } from '../middleware/auth';

const router = Router();
const internationalController = new InternationalController();

// International configuration routes
router.post('/', authenticate, internationalController.createInternationalConfig);
router.get('/', authenticate, internationalController.getInternationalConfigs);
router.get('/dashboard', authenticate, internationalController.getGlobalDashboard);
router.get('/:id', authenticate, internationalController.getInternationalConfig);
router.put('/:id', authenticate, internationalController.updateInternationalConfig);

// Region management
router.post('/:id/launch', authenticate, internationalController.launchRegion);
router.get('/language/:language', authenticate, internationalController.getRegionsByLanguage);

// Localization
router.get('/:region/localization/:key/:type?', authenticate, internationalController.getLocalizedContent);

// Regional pricing
router.get('/:region/pricing', authenticate, internationalController.getRegionalPricing);

// Compliance
router.get('/:region/compliance', authenticate, internationalController.getRegionalCompliance);

// Regional marketing
router.get('/:region/campaigns', authenticate, internationalController.getRegionalCampaigns);
router.post('/:region/campaigns', authenticate, internationalController.createRegionalCampaign);
router.put('/:region/campaigns/:campaignId', authenticate, internationalController.updateRegionalCampaign);

// Performance
router.get('/:region/performance', authenticate, internationalController.getRegionalPerformance);

export default router;
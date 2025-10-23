import express from 'express';
import { authenticateToken } from '../libs/auth-middleware.js';
import { getProjectAnalytics } from '../controllers/analytics-controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/project/:projectId', getProjectAnalytics);

export default router;

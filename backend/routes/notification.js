import express from 'express';
import { authenticateToken } from '../libs/auth-middleware.js';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notification-controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getUserNotifications);
router.patch('/:notificationId/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);

export default router;

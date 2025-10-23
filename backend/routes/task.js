import express from 'express';
import { authenticateToken } from '../libs/auth-middleware.js';
import {
  createTask,
  getProjectTasks,
  getUserProjectTasks,
  updateTask,
  updateTaskStatus,      
  updateHandoverNotes,
  getTaskById,           
  getAssignableMembers,
  deleteTask  // ✅ NEW: Import delete function
} from '../controllers/task-controller.js';

const router = express.Router();

router.use(authenticateToken);

// ✅ NEW: Add delete route
router.delete('/:taskId', deleteTask);

// Existing routes
router.patch('/:taskId/handover', updateHandoverNotes);
router.post('/:taskId/handover', updateHandoverNotes);
router.patch('/:taskId/status', updateTaskStatus);
router.post('/:taskId/status', updateTaskStatus);
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);

router.post('/', createTask);
router.get('/project/:projectId', getProjectTasks);
router.get('/project/:projectId/user', getUserProjectTasks);
router.get('/project/:projectId/members', getAssignableMembers);

export default router;

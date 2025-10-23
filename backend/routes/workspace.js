import express from 'express';
import { authenticateToken } from '../libs/auth-middleware.js';
import {
  createWorkspace,
  getUserWorkspaces,
  switchWorkspace,
  getUserTasks,
  getWorkspaceDetails,
  inviteMember,
  acceptInvite,
  getCurrentWorkspace,
  getWorkspaces,
  updateWorkspace,
  removeMember,
  changeMemberRole,
  transferWorkspace,
  deleteWorkspace,
  getAllWorkspaceTasks  // ✅ Add this
} from '../controllers/workspace-controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Existing routes
router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.post('/switch', switchWorkspace);
router.get('/tasks', getUserTasks);
router.post('/invite/accept/:token', acceptInvite);
router.post('/:workspaceId/invite', inviteMember);
router.get('/current', getCurrentWorkspace);
router.get('/all-tasks', getAllWorkspaceTasks);  // ✅ Add this route

// ✅ NEW CRUD ROUTES
router.put('/:workspaceId', updateWorkspace);                              // Update workspace
router.delete('/:workspaceId', deleteWorkspace);                          // Delete workspace
router.post('/:workspaceId/transfer', transferWorkspace);                 // Transfer ownership
router.delete('/:workspaceId/members/:userId', removeMember);             // Remove member
router.patch('/:workspaceId/members/:userId/role', changeMemberRole);     // ✅ NEW: Change member role

export default router;

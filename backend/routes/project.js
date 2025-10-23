import express from 'express';
import { authenticateToken } from '../libs/auth-middleware.js';
import {
  createProject,
  getWorkspaceProjects,
  getProjectDetails,
  getWorkspaceMembers,
  updateProject,
  deleteProject,
  addMemberToCategory,
  removeMemberFromCategory,
  changeMemberRoleInProject,
  getUserProjectRole
} from '../controllers/project-controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/members', getWorkspaceMembers); 
router.post('/', createProject);
router.get('/', getWorkspaceProjects);

router.get('/:projectId', getProjectDetails);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.get('/:projectId/role', getUserProjectRole);
router.post('/:projectId/members', addMemberToCategory);
router.delete('/:projectId/members', removeMemberFromCategory);

router.patch('/:projectId/categories/:categoryName/members/:memberId/role', changeMemberRoleInProject);

export default router;

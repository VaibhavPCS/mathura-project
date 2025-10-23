import express from 'express';
import upload from '../libs/upload-middleware.js';
import { authenticateToken } from '../libs/auth-middleware.js';
import {
    createComment,
    getTaskComments,
    getCommentReplies,
    updateComment,
    deleteComment
} from '../controllers/comment-controller.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/', upload.array('attachments', 3), createComment);
router.get('/task/:taskId', getTaskComments);
router.get('/:commentId/replies', getCommentReplies);
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);

export default router;

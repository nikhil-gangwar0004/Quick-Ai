import express from 'express';
import { getPublishedCreations, getUserCreations, toggleLikeCreations, getUserPlan } from '../controller/userController.js';
import { auth } from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.get('/get-user-plan', auth, getUserPlan);
userRouter.get('/get-user-creations', auth, getUserCreations);
userRouter.get('/get-published-creations', auth, getPublishedCreations);
userRouter.post('/toggle-like-creations', auth, toggleLikeCreations);

export default userRouter;
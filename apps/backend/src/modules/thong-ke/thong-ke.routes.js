import { Router } from 'express';
import { getDashboardStats } from './thong-ke.controller.js';

const router = Router();

router.get('/tong-quan', getDashboardStats);

export default router;

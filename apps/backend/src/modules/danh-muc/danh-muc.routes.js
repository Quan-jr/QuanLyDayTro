import { Router } from 'express';
import { getAllLookupData } from './danh-muc.controller.js';

const router = Router();

router.get('/', getAllLookupData);

export default router;

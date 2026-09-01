import { Router } from 'express';
import { getDanhSachNhanVien, createNhanVien } from './nhan-su.controller.js';

const router = Router();

router.get('/', getDanhSachNhanVien);
router.post('/', createNhanVien);

export default router;

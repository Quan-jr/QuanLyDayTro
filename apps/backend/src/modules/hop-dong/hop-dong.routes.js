import { Router } from 'express';
import {
  getDanhSachHopDong,
  createHopDong,
  getPhuongTienTheoHopDong,
} from './hop-dong.controller.js';

const router = Router();

router.get('/', getDanhSachHopDong);
router.post('/', createHopDong);
router.get('/:id_hop_dong/phuong-tien', getPhuongTienTheoHopDong);

export default router;

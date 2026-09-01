import { Router } from 'express';
import {
  getDanhSachChiSoDien,
  chotChiSoDien,
  getChiSoDienGanNhat,
} from './dien-nuoc.controller.js';

const router = Router();

router.get('/', getDanhSachChiSoDien);
router.post('/', chotChiSoDien);
router.get('/phong/:id_phong/gan-nhat', getChiSoDienGanNhat);

export default router;

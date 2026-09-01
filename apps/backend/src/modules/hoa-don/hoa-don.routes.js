import { Router } from 'express';
import {
  getDanhSachHoaDon,
  taoHoaDonTuDong,
  capNhatTrangThaiHoaDon,
} from './hoa-don.controller.js';

const router = Router();

router.get('/', getDanhSachHoaDon);
router.post('/', taoHoaDonTuDong);
router.patch('/:id/trang-thai', capNhatTrangThaiHoaDon);

export default router;

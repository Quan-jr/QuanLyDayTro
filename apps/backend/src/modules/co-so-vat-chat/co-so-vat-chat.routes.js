import { Router } from 'express';
import {
  getDanhSachDayTro,
  createDayTro,
  getDanhSachPhong,
  createPhong,
  updateTrangThaiPhong,
  getTaiSanTheoPhong,
  createTaiSanPhong,
  getDanhSachSuaChua,
  createNhatKySuaChua,
} from './co-so-vat-chat.controller.js';

const router = Router();

// Dãy trọ
router.get('/day-tro', getDanhSachDayTro);
router.post('/day-tro', createDayTro);

// Phòng
router.get('/phong', getDanhSachPhong);
router.post('/phong', createPhong);
router.patch('/phong/:id/trang-thai', updateTrangThaiPhong);

// Tài sản
router.get('/phong/:id_phong/tai-san', getTaiSanTheoPhong);
router.post('/tai-san', createTaiSanPhong);

// Sửa chữa
router.get('/sua-chua', getDanhSachSuaChua);
router.post('/sua-chua', createNhatKySuaChua);

export default router;

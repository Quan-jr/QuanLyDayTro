import { query } from '../../config/db.js';

export async function getAllLookupData(req, res, next) {
  try {
    const [
      vaiTro,
      gioiTinh,
      trangThaiPhong,
      trangThaiHopDong,
      trangThaiHoaDon,
      phanLoaiTaiSan,
      tinhTrangTaiSan,
      loaiXe,
    ] = await Promise.all([
      query('SELECT * FROM vai_tro ORDER BY id ASC'),
      query('SELECT * FROM gioi_tinh ORDER BY id ASC'),
      query('SELECT * FROM trang_thai_phong ORDER BY id ASC'),
      query('SELECT * FROM trang_thai_hop_dong ORDER BY id ASC'),
      query('SELECT * FROM trang_thai_hoa_don ORDER BY id ASC'),
      query('SELECT * FROM phan_loai_tai_san ORDER BY id ASC'),
      query('SELECT * FROM tinh_trang_tai_san ORDER BY id ASC'),
      query('SELECT * FROM loai_xe ORDER BY id ASC'),
    ]);

    res.json({
      success: true,
      data: {
        vaiTro: vaiTro.rows,
        gioiTinh: gioiTinh.rows,
        trangThaiPhong: trangThaiPhong.rows,
        trangThaiHopDong: trangThaiHopDong.rows,
        trangThaiHoaDon: trangThaiHoaDon.rows,
        phanLoaiTaiSan: phanLoaiTaiSan.rows,
        tinhTrangTaiSan: tinhTrangTaiSan.rows,
        loaiXe: loaiXe.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

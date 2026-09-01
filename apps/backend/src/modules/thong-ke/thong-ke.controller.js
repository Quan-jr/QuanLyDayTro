import { query } from '../../config/db.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [
      tongQuanPhong,
      tongQuanDayTro,
      tongQuanHopDong,
      tongQuanDoanhThu,
      hoaDonGanDay,
    ] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) AS tong_phong,
          COUNT(*) FILTER (WHERE id__trang_thai = 1) AS phong_trong,
          COUNT(*) FILTER (WHERE id__trang_thai = 2) AS phong_dang_thue,
          COUNT(*) FILTER (WHERE id__trang_thai = 3) AS phong_dang_sua,
          COUNT(*) FILTER (WHERE id__trang_thai = 4) AS phong_da_coc
        FROM phong;
      `),
      query(`SELECT COUNT(*) AS tong_day_tro FROM day_tro;`),
      query(`SELECT COUNT(*) AS hop_dong_hieu_luc FROM hop_dong WHERE id__trang_thai = 1;`),
      query(`
        SELECT 
          COALESCE(SUM(tong_so_tien) FILTER (WHERE id__trang_thai = 2), 0) AS da_thu,
          COALESCE(SUM(tong_so_tien) FILTER (WHERE id__trang_thai = 1 OR id__trang_thai = 4), 0) AS con_no,
          COALESCE(SUM(tong_so_tien), 0) AS tong_doanh_thu_du_kien
        FROM hoa_don;
      `),
      query(`
        SELECT 
          hd.id, hd.ky_thanh_toan, hd.tong_so_tien, hd.id__trang_thai,
          tthd.name AS ten_trang_thai,
          p.ten_phong, dt.ten_day_tro
        FROM hoa_don hd
        LEFT JOIN trang_thai_hoa_don tthd ON hd.id__trang_thai = tthd.id
        LEFT JOIN hop_dong hdb ON hd.id__hop_dong = hdb.id
        LEFT JOIN phong p ON hdb.id__phong = p.id
        LEFT JOIN day_tro dt ON p.id__day_tro = dt.id
        ORDER BY hd.id DESC
        LIMIT 6;
      `),
    ]);

    res.json({
      success: true,
      data: {
        phong: tongQuanPhong.rows[0],
        dayTro: tongQuanDayTro.rows[0],
        hopDong: tongQuanHopDong.rows[0],
        doanhThu: tongQuanDoanhThu.rows[0],
        hoaDonGanDay: hoaDonGanDay.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

import { query } from '../../config/db.js';

export async function getDanhSachHoaDon(req, res, next) {
  try {
    const { id__trang_thai, ky_thanh_toan } = req.query;
    let conditions = [];
    let params = [];

    if (id__trang_thai) {
      params.push(id__trang_thai);
      conditions.push(`hd.id__trang_thai = $${params.length}`);
    }
    if (ky_thanh_toan) {
      params.push(ky_thanh_toan);
      conditions.push(`hd.ky_thanh_toan = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        hd.*,
        tthd.name AS ten_trang_thai,
        p.ten_phong, dt.ten_day_tro,
        hdb.so_nguoi,
        d.dien_cu, d.dien_moi, (d.dien_moi - d.dien_cu) AS so_dien_tieu_thu
      FROM hoa_don hd
      LEFT JOIN trang_thai_hoa_don tthd ON hd.id__trang_thai = tthd.id
      LEFT JOIN hop_dong hdb ON hd.id__hop_dong = hdb.id
      LEFT JOIN phong p ON hdb.id__phong = p.id
      LEFT JOIN day_tro dt ON p.id__day_tro = dt.id
      LEFT JOIN dien d ON hd.id__dien = d.id
      ${whereClause}
      ORDER BY hd.ky_thanh_toan DESC, hd.id DESC;
    `;
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function taoHoaDonTuDong(req, res, next) {
  try {
    const { id__hop_dong, id__dien, ky_thanh_toan } = req.body;

    // 1. Lấy thông tin hợp đồng
    const hdRes = await query(`SELECT * FROM hop_dong WHERE id = $1`, [id__hop_dong]);
    if (hdRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
    }
    const hopDong = hdRes.rows[0];

    // 2. Đếm số lượng xe của hợp đồng
    const xeRes = await query(`SELECT COUNT(*) AS total FROM phuong_tien WHERE id__hop_dong = $1`, [id__hop_dong]);
    const soLuongXe = Number(xeRes.rows[0].total) || 0;

    // 3. Lấy chỉ số điện
    let tien_dien = 0;
    if (id__dien) {
      const dienRes = await query(`SELECT * FROM dien WHERE id = $1`, [id__dien]);
      if (dienRes.rows.length > 0) {
        const dienData = dienRes.rows[0];
        const soKwh = Math.max(0, Number(dienData.dien_moi) - Number(dienData.dien_cu));
        tien_dien = soKwh * Number(hopDong.don_gia_dien);
      }
    }

    const tien_nuoc = Number(hopDong.so_nguoi) * Number(hopDong.don_gia_nuoc);
    const tien_tro = Number(hopDong.gia_thue_phong);
    const tien_xe = soLuongXe * Number(hopDong.don_gia_gui_xe);
    const tien_dich_vu = Number(hopDong.don_gia_dich_vu);
    const tong_so_tien = tien_dien + tien_nuoc + tien_tro + tien_xe + tien_dich_vu;

    // 4. Lưu hóa đơn vào DB (id__trang_thai = 1: Chờ thanh toán)
    const insertSql = `
      INSERT INTO hoa_don (
        id__hop_dong, id__dien, ky_thanh_toan,
        tien_dien, tien_nuoc, tien_tro, tien_xe, tien_dich_vu,
        tong_so_tien, id__trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      id__hop_dong,
      id__dien || null,
      ky_thanh_toan,
      tien_dien,
      tien_nuoc,
      tien_tro,
      tien_xe,
      tien_dich_vu,
      tong_so_tien,
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tạo hóa đơn thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function capNhatTrangThaiHoaDon(req, res, next) {
  try {
    const { id } = req.params;
    const { id__trang_thai, ngay_nhan_tien, anh_thanh_toan } = req.body;

    const result = await query(
      `UPDATE hoa_don 
       SET id__trang_thai = $1, 
           ngay_nhan_tien = CASE WHEN $1 = 2 THEN COALESCE($2, CURRENT_DATE) ELSE ngay_nhan_tien END,
           anh_thanh_toan = COALESCE($3, anh_thanh_toan)
       WHERE id = $4 
       RETURNING *`,
      [Number(id__trang_thai), ngay_nhan_tien || null, anh_thanh_toan || null, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Cập nhật trạng thái hóa đơn thành công',
    });
  } catch (error) {
    next(error);
  }
}

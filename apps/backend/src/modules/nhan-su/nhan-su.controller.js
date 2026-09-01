import { query } from '../../config/db.js';

export async function getDanhSachNhanVien(req, res, next) {
  try {
    const sql = `
      SELECT 
        nv.*,
        vt.name AS ten_vai_tro,
        gt.name AS ten_gioi_tinh,
        dc.tinh, dc.thanh_pho_quan_huyen_xa, dc.chi_tiet_ngo_so_nha,
        nd.ten_dang_nhap, nd.chuc_vu
      FROM nhan_vien nv
      LEFT JOIN vai_tro vt ON nv.id__vai_tro = vt.id
      LEFT JOIN gioi_tinh gt ON nv.id__gioi_tinh = gt.id
      LEFT JOIN dia_chi_nhan_vien dc ON nv.id__dia_chi_nhan_vien = dc.id
      LEFT JOIN nguoi_dung nd ON nv.id__nguoi_dung = nd.id
      ORDER BY nv.id ASC;
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createNhanVien(req, res, next) {
  try {
    const {
      ho_va_ten,
      so_dien_thoai,
      id__gioi_tinh,
      cccd,
      id__vai_tro,
      tinh,
      thanh_pho_quan_huyen_xa,
      chi_tiet_ngo_so_nha,
    } = req.body;

    let id__dia_chi_nhan_vien = null;
    if (tinh || thanh_pho_quan_huyen_xa || chi_tiet_ngo_so_nha) {
      const diaChiRes = await query(
        `INSERT INTO dia_chi_nhan_vien (tinh, thanh_pho_quan_huyen_xa, chi_tiet_ngo_so_nha) VALUES ($1, $2, $3) RETURNING id`,
        [tinh || '', thanh_pho_quan_huyen_xa || '', chi_tiet_ngo_so_nha || '']
      );
      id__dia_chi_nhan_vien = diaChiRes.rows[0].id;
    }

    const result = await query(
      `INSERT INTO nhan_vien (ho_va_ten, so_dien_thoai, id__gioi_tinh, cccd, id__vai_tro, id__dia_chi_nhan_vien)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ho_va_ten, so_dien_thoai, id__gioi_tinh || null, cccd || null, id__vai_tro || null, id__dia_chi_nhan_vien]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Thêm nhân viên thành công',
    });
  } catch (error) {
    next(error);
  }
}

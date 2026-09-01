import { query } from '../../config/db.js';

// ==================== DÃY TRỌ ====================
export async function getDanhSachDayTro(req, res, next) {
  try {
    const sql = `
      SELECT 
        dt.*,
        dc.tinh, dc.thanh_pho_quan_huyen_xa, dc.chi_tiet_ngo_so_nha,
        nv.ho_va_ten AS ten_quan_ly, nv.so_dien_thoai AS sdt_quan_ly,
        COUNT(p.id) AS tong_so_phong_thuc_te,
        COUNT(p.id) FILTER (WHERE p.id__trang_thai = 1) AS so_phong_trong,
        COUNT(p.id) FILTER (WHERE p.id__trang_thai = 2) AS so_phong_dang_thue
      FROM day_tro dt
      LEFT JOIN dia_chi_day_tro dc ON dt.id__dia_chi_day_tro = dc.id
      LEFT JOIN nhan_vien nv ON dt.id__nhan_vien = nv.id
      LEFT JOIN phong p ON dt.id = p.id__day_tro
      GROUP BY dt.id, dc.id, nv.id
      ORDER BY dt.id ASC;
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createDayTro(req, res, next) {
  try {
    const { ten_day_tro, so_luong_phong, id__nhan_vien, tinh, thanh_pho_quan_huyen_xa, chi_tiet_ngo_so_nha } = req.body;
    
    let id__dia_chi_day_tro = null;
    if (tinh || thanh_pho_quan_huyen_xa || chi_tiet_ngo_so_nha) {
      const diaChiRes = await query(
        `INSERT INTO dia_chi_day_tro (tinh, thanh_pho_quan_huyen_xa, chi_tiet_ngo_so_nha) VALUES ($1, $2, $3) RETURNING id`,
        [tinh || '', thanh_pho_quan_huyen_xa || '', chi_tiet_ngo_so_nha || '']
      );
      id__dia_chi_day_tro = diaChiRes.rows[0].id;
    }

    const result = await query(
      `INSERT INTO day_tro (ten_day_tro, so_luong_phong, id__nhan_vien, id__dia_chi_day_tro) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ten_day_tro, Number(so_luong_phong) || 0, id__nhan_vien || null, id__dia_chi_day_tro]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Thêm dãy trọ thành công' });
  } catch (error) {
    next(error);
  }
}

// ==================== PHÒNG TRỌ ====================
export async function getDanhSachPhong(req, res, next) {
  try {
    const { id__day_tro, id__trang_thai } = req.query;
    let conditions = [];
    let params = [];

    if (id__day_tro) {
      params.push(id__day_tro);
      conditions.push(`p.id__day_tro = $${params.length}`);
    }
    if (id__trang_thai) {
      params.push(id__trang_thai);
      conditions.push(`p.id__trang_thai = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        p.*,
        dt.ten_day_tro,
        ttp.name AS ten_trang_thai,
        hd.id AS id_hop_dong_hien_tai,
        hd.ngay_bat_dau, hd.ngay_ket_thuc, hd.so_nguoi,
        hd.don_gia_dien, hd.don_gia_nuoc, hd.don_gia_dich_vu, hd.don_gia_gui_xe
      FROM phong p
      LEFT JOIN day_tro dt ON p.id__day_tro = dt.id
      LEFT JOIN trang_thai_phong ttp ON p.id__trang_thai = ttp.id
      LEFT JOIN hop_dong hd ON p.id = hd.id__phong AND hd.id__trang_thai = 1
      ${whereClause}
      ORDER BY p.id__day_tro ASC, p.so_tang ASC, p.ten_phong ASC;
    `;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createPhong(req, res, next) {
  try {
    const { id__day_tro, ten_phong, so_tang, so_tien_tro, id__trang_thai } = req.body;
    const result = await query(
      `INSERT INTO phong (id__day_tro, ten_phong, so_tang, so_tien_tro, id__trang_thai)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id__day_tro, ten_phong, Number(so_tang) || 1, Number(so_tien_tro) || 0, Number(id__trang_thai) || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Thêm phòng thành công' });
  } catch (error) {
    next(error);
  }
}

export async function updateTrangThaiPhong(req, res, next) {
  try {
    const { id } = req.params;
    const { id__trang_thai } = req.body;
    const result = await query(
      `UPDATE phong SET id__trang_thai = $1 WHERE id = $2 RETURNING *`,
      [Number(id__trang_thai), id]
    );
    res.json({ success: true, data: result.rows[0], message: 'Cập nhật trạng thái phòng thành công' });
  } catch (error) {
    next(error);
  }
}

// ==================== TÀI SẢN PHÒNG ====================
export async function getTaiSanTheoPhong(req, res, next) {
  try {
    const { id_phong } = req.params;
    const sql = `
      SELECT ts.*, plt.name AS ten_phan_loai, tt.name AS ten_tinh_trang
      FROM tai_san_phong ts
      LEFT JOIN phan_loai_tai_san plt ON ts.id__phan_loai = plt.id
      LEFT JOIN tinh_trang_tai_san tt ON ts.id__tinh_trang = tt.id
      WHERE ts.id__phong = $1
      ORDER BY ts.id ASC;
    `;
    const result = await query(sql, [id_phong]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createTaiSanPhong(req, res, next) {
  try {
    const { id__phong, id__phan_loai, ten_chi_tiet, id__tinh_trang, mo_ta, hinh_anh } = req.body;
    const result = await query(
      `INSERT INTO tai_san_phong (id__phong, id__phan_loai, ten_chi_tiet, id__tinh_trang, mo_ta, hinh_anh)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id__phong, id__phan_loai || null, ten_chi_tiet, id__tinh_trang || null, mo_ta || '', hinh_anh || '']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Thêm tài sản thành công' });
  } catch (error) {
    next(error);
  }
}

// ==================== NHẬT KÝ SỬA CHỮA ====================
export async function getDanhSachSuaChua(req, res, next) {
  try {
    const sql = `
      SELECT 
        nk.*, 
        p.ten_phong, dt.ten_day_tro,
        ts.ten_chi_tiet AS ten_tai_san
      FROM nhat_ky_sua_chua nk
      LEFT JOIN phong p ON nk.id__phong = p.id
      LEFT JOIN day_tro dt ON p.id__day_tro = dt.id
      LEFT JOIN tai_san_phong ts ON nk.id__tai_san_phong = ts.id
      ORDER BY nk.ngay_sua DESC, nk.id DESC;
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createNhatKySuaChua(req, res, next) {
  try {
    const { id__phong, id__tai_san_phong, gia_sua, mo_ta, ngay_sua } = req.body;
    const result = await query(
      `INSERT INTO nhat_ky_sua_chua (id__phong, id__tai_san_phong, gia_sua, mo_ta, ngay_sua)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id__phong, id__tai_san_phong || null, Number(gia_sua) || 0, mo_ta || '', ngay_sua || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Ghi nhật ký sửa chữa thành công' });
  } catch (error) {
    next(error);
  }
}

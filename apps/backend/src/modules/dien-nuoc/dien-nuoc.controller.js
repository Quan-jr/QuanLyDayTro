import { query } from '../../config/db.js';

export async function getDanhSachChiSoDien(req, res, next) {
  try {
    const { id__phong, ky_chot } = req.query;
    let conditions = [];
    let params = [];

    if (id__phong) {
      params.push(id__phong);
      conditions.push(`d.id__phong = $${params.length}`);
    }
    if (ky_chot) {
      params.push(ky_chot);
      conditions.push(`d.ky_chot = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        d.*,
        (d.dien_moi - d.dien_cu) AS so_dien_tieu_thu,
        p.ten_phong, dt.ten_day_tro
      FROM dien d
      LEFT JOIN phong p ON d.id__phong = p.id
      LEFT JOIN day_tro dt ON p.id__day_tro = dt.id
      ${whereClause}
      ORDER BY d.ngay_chot DESC, d.id DESC;
    `;
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function chotChiSoDien(req, res, next) {
  try {
    const { id__phong, ky_chot, dien_cu, dien_moi, ngay_chot } = req.body;

    if (Number(dien_moi) < Number(dien_cu)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ',
      });
    }

    const result = await query(
      `INSERT INTO dien (id__phong, ky_chot, dien_cu, dien_moi, ngay_chot)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id__phong, ky_chot, Number(dien_cu), Number(dien_moi), ngay_chot || new Date()]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Ghi nhận chỉ số điện thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function getChiSoDienGanNhat(req, res, next) {
  try {
    const { id_phong } = req.params;
    const result = await query(
      `SELECT * FROM dien WHERE id__phong = $1 ORDER BY ngay_chot DESC, id DESC LIMIT 1`,
      [id_phong]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    next(error);
  }
}

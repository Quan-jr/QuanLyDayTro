import { query } from '../../config/db.js';

export async function getDanhSachHopDong(req, res, next) {
  try {
    const sql = `
      SELECT 
        hd.*,
        p.ten_phong, dt.ten_day_tro,
        tthd.name AS ten_trang_thai,
        nv.ho_va_ten AS ten_khach_thue,
        nv.so_dien_thoai AS sdt_khach_thue,
        nv.cccd AS cccd_khach_thue,
        dc.tinh AS tinh_que_quan,
        dc.chi_tiet_ngo_so_nha AS dia_chi_khach,
        COUNT(pt.id) AS so_luong_xe
      FROM hop_dong hd
      LEFT JOIN phong p ON hd.id__phong = p.id
      LEFT JOIN day_tro dt ON p.id__day_tro = dt.id
      LEFT JOIN trang_thai_hop_dong tthd ON hd.id__trang_thai = tthd.id
      LEFT JOIN nhan_vien nv ON hd.id__nhan_vien = nv.id
      LEFT JOIN dia_chi_nhan_vien dc ON nv.id__dia_chi_nhan_vien = dc.id
      LEFT JOIN phuong_tien pt ON hd.id = pt.id__hop_dong
      GROUP BY hd.id, p.id, dt.id, tthd.id, nv.id, dc.id
      ORDER BY hd.id DESC;
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createHopDong(req, res, next) {
  try {
    const {
      id__phong,
      // Thông tin khách thuê tạo mới trực tiếp
      ho_va_ten,
      so_dien_thoai,
      cccd,
      id__gioi_tinh,
      que_quan,
      // Thông tin hợp đồng
      ngay_bat_dau,
      ngay_ket_thuc,
      ky_han_o,
      so_nguoi,
      gia_thue_phong,
      tien_coc,
      don_gia_dien,
      don_gia_nuoc,
      don_gia_dich_vu,
      don_gia_gui_xe,
      file_chi_tiet_hop_dong,
      phuong_tien, // Mảng danh sách xe nếu có: [{ hang_xe, id__loai_xe, ten_xe, bien_so_xe }]
    } = req.body;

    let finalIdNhanVien = req.body.id__nhan_vien || null;

    // 1. Nếu người dùng nhập thông tin khách thuê mới -> Bắt buộc tạo hồ sơ trong bảng nhan_vien & dia_chi_nhan_vien
    if (ho_va_ten && so_dien_thoai) {
      let idDiaChi = null;
      
      const diaChiTinh = req.body.tinh || req.body.que_tinh || '';
      const diaChiHuyenXa = req.body.thanh_pho_quan_huyen_xa || [req.body.que_quan_huyen, req.body.que_phuong_xa].filter(Boolean).join(', ');
      const diaChiChiTiet = req.body.chi_tiet_ngo_so_nha || req.body.que_chi_tiet || req.body.que_quan || '';

      if (diaChiTinh || diaChiHuyenXa || diaChiChiTiet) {
        const resDC = await query(
          `INSERT INTO dia_chi_nhan_vien (tinh, thanh_pho_quan_huyen_xa, chi_tiet_ngo_so_nha) 
           VALUES ($1, $2, $3) RETURNING id;`,
          [diaChiTinh, diaChiHuyenXa, diaChiChiTiet]
        );
        idDiaChi = resDC.rows[0].id;
      }

      // Tự động gán vai trò là 'Người thuê' trong bảng vai_tro
      let idVaiTroNguoiThue = 4;
      try {
        const roleRes = await query(`SELECT id FROM vai_tro WHERE name = 'Người thuê' LIMIT 1;`);
        if (roleRes.rows.length > 0) {
          idVaiTroNguoiThue = roleRes.rows[0].id;
        }
      } catch (e) {}

      const resNV = await query(
        `INSERT INTO nhan_vien (ho_va_ten, so_dien_thoai, cccd, id__gioi_tinh, id__vai_tro, id__dia_chi_nhan_vien)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
        [
          ho_va_ten.trim(),
          so_dien_thoai.trim(),
          cccd ? cccd.trim() : null,
          Number(id__gioi_tinh) || 1,
          idVaiTroNguoiThue,
          idDiaChi
        ]
      );
      finalIdNhanVien = resNV.rows[0].id;
    }

    // 2. Tạo hợp đồng mới (id__nhan_vien lưu ID người thuê phòng vừa tạo)
    const sqlHopDong = `
      INSERT INTO hop_dong (
        id__phong, id__nhan_vien, ngay_bat_dau, ngay_ket_thuc, ky_han_o,
        so_nguoi, gia_thue_phong, tien_coc, don_gia_dien, don_gia_nuoc,
        don_gia_dich_vu, don_gia_gui_xe, file_chi_tiet_hop_dong, id__trang_thai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1)
      RETURNING *;
    `;

    const resultHD = await query(sqlHopDong, [
      id__phong,
      finalIdNhanVien,
      ngay_bat_dau,
      ngay_ket_thuc || null,
      ky_han_o || '',
      Number(so_nguoi) || 1,
      Number(gia_thue_phong) || 0,
      Number(tien_coc) || 0,
      Number(don_gia_dien) || 0,
      Number(don_gia_nuoc) || 0,
      Number(don_gia_dich_vu) || 0,
      Number(don_gia_gui_xe) || 0,
      file_chi_tiet_hop_dong || '',
    ]);

    const hopDongMoi = resultHD.rows[0];

    // 3. Tự động cập nhật phòng sang trạng thái "Đang thuê" (id = 2)
    await query(`UPDATE phong SET id__trang_thai = 2 WHERE id = $1`, [id__phong]);

    // 4. Thêm phương tiện nếu có
    if (Array.isArray(phuong_tien) && phuong_tien.length > 0) {
      for (const xe of phuong_tien) {
        if (xe.bien_so_xe || xe.ten_xe) {
          await query(
            `INSERT INTO phuong_tien (id__hop_dong, hang_xe, id__loai_xe, ten_xe, bien_so_xe)
             VALUES ($1, $2, $3, $4, $5)`,
            [hopDongMoi.id, xe.hang_xe || '', xe.id__loai_xe || null, xe.ten_xe || '', xe.bien_so_xe || '']
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      data: hopDongMoi,
      message: 'Tạo người thuê và lập hợp đồng thuê phòng thành công',
    });
  } catch (error) {
    next(error);
  }
}

export async function getPhuongTienTheoHopDong(req, res, next) {
  try {
    const { id_hop_dong } = req.params;
    const sql = `
      SELECT pt.*, lx.name AS ten_loai_xe
      FROM phuong_tien pt
      LEFT JOIN loai_xe lx ON pt.id__loai_xe = lx.id
      WHERE pt.id__hop_dong = $1
      ORDER BY pt.id ASC;
    `;
    const result = await query(sql, [id_hop_dong]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

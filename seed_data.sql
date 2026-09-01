-- =============================================================================
-- SCRIPT CHÈN DỮ LIỆU MẪU
-- Khóa ngoại: id__dia_chi_day_tro & id__dia_chi_nhan_vien
-- =============================================================================

-- Xóa dữ liệu cũ
TRUNCATE TABLE hoa_don, dien, phuong_tien, hop_dong, nhat_ky_sua_chua, tai_san_phong, phong, day_tro, nhan_vien, nguoi_dung, dia_chi_day_tro, dia_chi_nhan_vien RESTART IDENTITY CASCADE;

-- 1. BẢNG ĐỊA CHỈ DÃY TRỌ (dia_chi_day_tro)
INSERT INTO dia_chi_day_tro (tinh, thanh_pho_quan_huyen_xa, chi_tiet_ngo_so_nha) VALUES
('Hà Nội', 'Quận Cầu Giấy, Phường Dịch Vọng Hậu', 'Số 15, Ngõ 80 Phố Trần Thái Tông'),
('Hà Nội', 'Quận Nam Từ Liêm, Phường Mỹ Đình 2', 'Số 28, Ngách 12/4 Phố Lê Đức Thọ'),
('TP. Hồ Chí Minh', 'Quận Bình Thạnh, Phường 25', 'Số 88/12 Đường D2 (Nguyễn Gia Trí)');

-- 2. BẢNG ĐỊA CHỈ NHÂN VIÊN & NGƯỜI THUÊ (dia_chi_nhan_vien)
INSERT INTO dia_chi_nhan_vien (tinh, thanh_pho_quan_huyen_xa, chi_tiet_ngo_so_nha) VALUES
-- Địa chỉ 1: Chủ trọ
('Hà Nội', 'Quận Đống Đa, Phường Láng Thượng', 'Số 45 Chùa Láng'),

-- Địa chỉ 2: Quản lý dãy
('Hà Nội', 'Quận Thanh Xuân, Phường Nhân Chính', 'Số 116 Phố Quan Nhân'),

-- Địa chỉ 3 -> 10: Quê quán 8 khách thuê phòng
('Nam Định', 'Huyện Hải Hậu, Xã Hải Trung', 'Xóm 5'),
('Thái Bình', 'Huyện Đông Hưng, Xã Đông Các', 'Thôn 3'),
('Thanh Hóa', 'Thành phố Thanh Hóa, Phường Điện Biên', 'Số 22 Phố Lê Hoàn'),
('Nghệ An', 'Thành phố Vinh, Phường Hưng Bình', 'Số 104 Đường Nguyễn Thị Minh Khai'),
('Hải Dương', 'Huyện Thanh Hà, Xã Thanh Xá', 'Thôn Tiên Kiều'),
('Bắc Ninh', 'Thị xã Từ Sơn, Phường Đình Bảng', 'Khu phố Đình Đền'),
('Phú Thọ', 'Thành phố Việt Trì, Phường Nông Trang', 'Tổ 15'),
('Cần Thơ', 'Quận Ninh Kiều, Phường An Khánh', 'Số 78 Đường 3 Tháng 2');

-- 3. TÀI KHOẢN NGƯỜI DÙNG (USER)
INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau, ma_hash, chuc_vu) VALUES
('admin_chung', '123456', 'hash_admin', 'Chủ trọ / Quản trị viên'),
('quanly_hung', '123456', 'hash_hung', 'Quản lý dãy Cầu Giấy');

-- 4. HỒ SƠ NGƯỜI DÙNG / NHÂN VIÊN / KHÁCH THUÊ (nhan_vien)
-- Cột khóa ngoại: id__dia_chi_nhan_vien trỏ tới dia_chi_nhan_vien
INSERT INTO nhan_vien (id__nguoi_dung, ho_va_ten, so_dien_thoai, id__gioi_tinh, cccd, id__vai_tro, id__dia_chi_nhan_vien) VALUES
-- Quản lý & Chủ trọ
(1, 'Nguyễn Thành Chung (Chủ trọ)', '0988123456', 1, '001090012345', 1, 1),
(2, 'Vũ Đức Hùng (Quản lý dãy)', '0912345678', 1, '001092054321', 2, 2),

-- Khách thuê trọ (Tenant) đại diện ký hợp đồng (id__vai_tro = 4: Người thuê)
(NULL, 'Nguyễn Văn Minh (Khách thuê P.101)', '0985112233', 1, '036098011223', 4, 3),
(NULL, 'Trần Thị Thu Huyền (Khách thuê P.102)', '0973445566', 2, '034199022334', 4, 4),
(NULL, 'Lê Anh Tuấn (Khách thuê P.201)', '0914778899', 1, '038097033445', 4, 5),
(NULL, 'Phạm Thu Trang (Khách thuê P.301)', '0966332211', 2, '037198044556', 4, 6),
(NULL, 'Hoàng Minh Đức (Khách thuê P.101 MĐ)', '0905667788', 1, '030096055667', 4, 7),
(NULL, 'Vũ Hải Yến (Khách thuê P.102 MĐ)', '0944119922', 2, '031197066778', 4, 8),
(NULL, 'Đặng Quang Huy (Khách thuê P.201 MĐ)', '0933887766', 1, '033095077889', 4, 9),
(NULL, 'Bùi Thảo Vy (Khách thuê P.101 BT)', '0922445533', 2, '079198088990', 4, 10);

-- 5. DÃY TRỌ (Cột khóa ngoại: id__dia_chi_day_tro trỏ tới dia_chi_day_tro)
INSERT INTO day_tro (id__nhan_vien, id__dia_chi_day_tro, ten_day_tro, so_luong_phong, trang_thai) VALUES
(2, 1, 'Dãy Trọ Xanh - Cầu Giấy', 10, 'Đang hoạt động'),
(2, 2, 'Tòa Nhà Hoàng Gia - Mỹ Đình', 12, 'Đang hoạt động'),
(2, 3, 'Khu Trọ Bình An - Bình Thạnh', 8, 'Đang hoạt động');

-- 6. PHÒNG TRỌ
INSERT INTO phong (id__day_tro, ten_phong, so_tang, so_tien_tro, id__trang_thai) VALUES
-- Dãy 1: Cầu Giấy (id = 1)
(1, 'P.101', 1, 2800000, 2),
(1, 'P.102', 1, 2800000, 2),
(1, 'P.201', 2, 3000000, 2),
(1, 'P.202', 2, 3000000, 1),
(1, 'P.301', 3, 3200000, 2),
(1, 'P.302', 3, 3200000, 3),

-- Dãy 2: Mỹ Đình (id = 2)
(2, 'P.101', 1, 3500000, 2),
(2, 'P.102', 1, 3500000, 2),
(2, 'P.201', 2, 3800000, 2),
(2, 'P.202', 2, 3800000, 1),
(2, 'P.301', 3, 4000000, 1),

-- Dãy 3: Bình Thạnh (id = 3)
(3, 'P.101', 1, 2400000, 2),
(3, 'P.102', 1, 2400000, 1);

-- 7. TÀI SẢN TRONG PHÒNG
INSERT INTO tai_san_phong (id__phong, id__phan_loai, ten_chi_tiet, id__tinh_trang, mo_ta, hinh_anh) VALUES
(1, 1, 'Điều hòa Daikin 9000 BTU Inverter', 2, 'Hoạt động êm, tiết kiệm điện', ''),
(1, 3, 'Bình nóng lạnh Ariston 20L', 2, 'Làm nóng nhanh, chống giật', ''),
(1, 2, 'Giường ngủ gỗ xoan đào 1.6m x 2m', 2, 'Kèm đệm cao su', ''),
(1, 2, 'Tủ quần áo 2 cánh gỗ công nghiệp', 2, 'Đầy đủ móc treo', ''),
(2, 1, 'Điều hòa Casper 9000 BTU', 2, 'Mới lắp đầu năm', ''),
(3, 1, 'Tủ lạnh mini Aqua 90L', 2, 'Dùng tốt, không đóng tuyết', ''),
(6, 3, 'Vòi sen tắm & Vòi xịt vệ sinh', 4, 'Bị rò rỉ nước ở đầu gioăng cao su', '');

-- 8. NHẬT KÝ SỬA CHỮA
INSERT INTO nhat_ky_sua_chua (id__phong, id__tai_san_phong, gia_sua, mo_ta, ngay_sua) VALUES
(1, 1, 250000, 'Bảo dưỡng nạp gas điều hòa định kỳ', '2026-07-15'),
(6, 7, 180000, 'Thay thế cụm vòi sen tắm INAX và gioăng', '2026-08-20'),
(2, NULL, 120000, 'Thay bóng đèn LED âm trần phòng khách', '2026-08-25');

-- 9. HỢP ĐỒNG THUÊ PHÒNG (id__nhan_vien = Người thuê phòng / Khách thuê đại diện)
INSERT INTO hop_dong (
    id__phong, id__nhan_vien, ngay_bat_dau, ngay_ket_thuc, ky_han_o,
    so_nguoi, gia_thue_phong, tien_coc, don_gia_dien, don_gia_nuoc,
    don_gia_dich_vu, don_gia_gui_xe, file_chi_tiet_hop_dong, id__trang_thai
) VALUES
(1, 3, '2026-01-10', '2027-01-10', '12 tháng', 2, 2800000, 2800000, 3500, 100000, 150000, 100000, 'hop_dong_p101_minh.pdf', 1),
(2, 4, '2026-02-15', '2026-08-15', '6 tháng', 1, 2800000, 2800000, 3500, 100000, 120000, 100000, 'hop_dong_p102_huyen.pdf', 1),
(3, 5, '2026-03-01', '2027-03-01', '12 tháng', 2, 3000000, 3000000, 3500, 100000, 150000, 100000, 'hop_dong_p201_tuan.pdf', 1),
(5, 6, '2026-05-01', '2026-11-01', '6 tháng', 2, 3200000, 3200000, 3500, 100000, 150000, 100000, 'hop_dong_p301_trang.pdf', 1),
(7, 7, '2026-02-01', '2027-02-01', '12 tháng', 2, 3500000, 3500000, 3800, 100000, 150000, 100000, 'hop_dong_mydinh_101_duc.pdf', 1),
(8, 8, '2026-04-10', '2026-10-10', '6 tháng', 1, 3500000, 3500000, 3800, 100000, 120000, 100000, 'hop_dong_mydinh_102_yen.pdf', 1),
(9, 9, '2026-03-15', '2027-03-15', '12 tháng', 3, 3800000, 3800000, 3800, 100000, 180000, 100000, 'hop_dong_mydinh_201_huy.pdf', 1),
(12, 10, '2026-01-01', '2027-01-01', '12 tháng', 1, 2400000, 2400000, 3500, 100000, 100000, 100000, 'hop_dong_binhthanh_101_vy.pdf', 1);

-- 10. PHƯƠNG TIỆN CỦA KHÁCH THUÊ
INSERT INTO phuong_tien (id__hop_dong, hang_xe, id__loai_xe, ten_xe, bien_so_xe) VALUES
(1, 'Honda', 1, 'Vision 110cc', '29B1-987.65'),
(1, 'Yamaha', 1, 'Grande 125', '29E2-345.67'),
(2, 'Honda', 1, 'Wave Alpha', '30F4-112.23'),
(3, 'Honda', 1, 'Air Blade 125', '29D1-888.99'),
(4, 'VinFast', 2, 'Feliz S (Xe điện)', '29MD1-456.78'),
(5, 'Honda', 1, 'SH Mode 125', '29C1-678.90'),
(5, 'Yamaha', 1, 'Exciter 150', '29K1-223.34'),
(6, 'Honda', 1, 'Lead 125', '29X5-556.77'),
(7, 'Honda', 1, 'Future 125', '59P1-123.45'),
(8, 'Honda', 1, 'Vision Smartkey', '59T2-789.01');

-- 11. CHỐT CHỈ SỐ ĐIỆN (Kỳ 2026-07 & 2026-08)
INSERT INTO dien (id__phong, ky_chot, dien_cu, dien_moi, ngay_chot) VALUES
(1, '2026-07', 1250, 1375, '2026-07-31'),
(1, '2026-08', 1375, 1515, '2026-08-31'),
(2, '2026-08', 840, 925, '2026-08-31'),
(3, '2026-08', 2100, 2268, '2026-08-31'),
(5, '2026-08', 1540, 1720, '2026-08-31'),
(7, '2026-08', 3200, 3410, '2026-08-31'),
(8, '2026-08', 1100, 1195, '2026-08-31'),
(9, '2026-08', 4300, 4560, '2026-08-31'),
(12, '2026-08', 920, 1005, '2026-08-31');

-- 12. HÓA ĐƠN THU TIỀN (Kỳ 2026-08)
INSERT INTO hoa_don (
    id__hop_dong, id__dien, ky_thanh_toan,
    tien_dien, tien_nuoc, tien_tro, tien_xe, tien_dich_vu,
    tong_so_tien, id__trang_thai, ngay_nhan_tien
) VALUES
(1, 2, '2026-08', 490000, 200000, 2800000, 200000, 150000, 3840000, 2, '2026-09-02'),
(2, 3, '2026-08', 297500, 100000, 2800000, 100000, 120000, 3417500, 2, '2026-09-03'),
(3, 4, '2026-08', 588000, 200000, 3000000, 100000, 150000, 4038000, 1, NULL),
(4, 5, '2026-08', 630000, 200000, 3200000, 100000, 150000, 4280000, 1, NULL),
(5, 6, '2026-08', 798000, 200000, 3500000, 200000, 150000, 4848000, 2, '2026-09-01'),
(6, 7, '2026-08', 361000, 100000, 3500000, 0, 120000, 4081000, 4, NULL),
(7, 8, '2026-08', 988000, 300000, 3800000, 100000, 180000, 5368000, 1, NULL),
(8, 9, '2026-08', 297500, 100000, 2400000, 100000, 100000, 2997500, 2, '2026-09-01');

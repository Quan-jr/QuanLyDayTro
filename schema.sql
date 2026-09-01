-- =============================================================================
-- HỆ THỐNG QUẢN LÝ DÃY TRỌ - DATABASE SCHEMA (POSTGRESQL)
-- Kiến trúc: Modular Monolith
-- Chuẩn quy ước: Tiếng Việt không dấu (snake_case), Khóa ngoại định dạng id__ (2 gạch)
-- 2 BẢNG ĐỊA CHỈ: dia_chi_day_tro & dia_chi_nhan_vien
-- CỘT KHÓA NGOẠI: id__dia_chi_day_tro & id__dia_chi_nhan_vien
-- =============================================================================

-- Xóa các bảng cũ nếu tồn tại (Drop theo thứ tự phụ thuộc)
DROP TABLE IF EXISTS hoa_don CASCADE;
DROP TABLE IF EXISTS dien CASCADE;
DROP TABLE IF EXISTS phuong_tien CASCADE;
DROP TABLE IF EXISTS hop_dong CASCADE;
DROP TABLE IF EXISTS nhat_ky_sua_chua CASCADE;
DROP TABLE IF EXISTS tai_san_phong CASCADE;
DROP TABLE IF EXISTS phong CASCADE;
DROP TABLE IF EXISTS day_tro CASCADE;
DROP TABLE IF EXISTS nhan_vien CASCADE;
DROP TABLE IF EXISTS nguoi_dung CASCADE;
DROP TABLE IF EXISTS dia_chi_day_tro CASCADE;
DROP TABLE IF EXISTS dia_chi_nhan_vien CASCADE;
DROP TABLE IF EXISTS dia_chi CASCADE;

-- Bảng danh mục
DROP TABLE IF EXISTS vai_tro CASCADE;
DROP TABLE IF EXISTS gioi_tinh CASCADE;
DROP TABLE IF EXISTS trang_thai_phong CASCADE;
DROP TABLE IF EXISTS trang_thai_hop_dong CASCADE;
DROP TABLE IF EXISTS trang_thai_hoa_don CASCADE;
DROP TABLE IF EXISTS phan_loai_tai_san CASCADE;
DROP TABLE IF EXISTS tinh_trang_tai_san CASCADE;
DROP TABLE IF EXISTS loai_xe CASCADE;

-- =============================================================================
-- 1. BẢNG DANH MỤC DÙNG CHUNG (Tất cả có 2 cột: id SERIAL PK, name VARCHAR NOT NULL)
-- =============================================================================

CREATE TABLE vai_tro (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE gioi_tinh (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE trang_thai_phong (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE trang_thai_hop_dong (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE trang_thai_hoa_don (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE phan_loai_tai_san (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tinh_trang_tai_san (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE loai_xe (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- =============================================================================
-- 2. BẢNG ĐỊA CHỈ TÁCH BIỆT: dia_chi_day_tro & dia_chi_nhan_vien
-- =============================================================================

-- Bảng Địa chỉ Dãy Trọ (Vị trí kinh doanh nhà trọ)
CREATE TABLE dia_chi_day_tro (
    id SERIAL PRIMARY KEY,
    tinh VARCHAR(100),
    thanh_pho_quan_huyen_xa VARCHAR(150),
    chi_tiet_ngo_so_nha VARCHAR(255)
);

-- Bảng Địa chỉ Nhân Viên & Người Thuê (Quê quán, thường trú của nhân sự/khách)
CREATE TABLE dia_chi_nhan_vien (
    id SERIAL PRIMARY KEY,
    tinh VARCHAR(100),
    thanh_pho_quan_huyen_xa VARCHAR(150),
    chi_tiet_ngo_so_nha VARCHAR(255)
);

-- =============================================================================
-- 3. BẢNG NGƯỜI DÙNG & NHÂN VIÊN / KHÁCH THUÊ
-- =============================================================================

-- Bảng Tài khoản Người dùng (User)
CREATE TABLE nguoi_dung (
    id SERIAL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    ma_hash VARCHAR(255),
    chuc_vu VARCHAR(50),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Nhân sự & Người thuê phòng (Employee / Tenant)
-- Cột khóa ngoại ref: id__dia_chi_nhan_vien
CREATE TABLE nhan_vien (
    id SERIAL PRIMARY KEY,
    id__nguoi_dung INT UNIQUE,             -- Có thể NULL đối với khách thuê
    ho_va_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    id__gioi_tinh INT,                     -- FK: gioi_tinh
    cccd VARCHAR(20) UNIQUE,
    id__vai_tro INT,                       -- FK: vai_tro (4: Người thuê, 1: Chủ trọ, 2: Quản lý)
    id__dia_chi_nhan_vien INT,             -- FK: dia_chi_nhan_vien
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nhan_vien_nguoi_dung FOREIGN KEY (id__nguoi_dung) REFERENCES nguoi_dung(id) ON DELETE SET NULL,
    CONSTRAINT fk_nhan_vien_gioi_tinh FOREIGN KEY (id__gioi_tinh) REFERENCES gioi_tinh(id) ON DELETE SET NULL,
    CONSTRAINT fk_nhan_vien_vai_tro FOREIGN KEY (id__vai_tro) REFERENCES vai_tro(id) ON DELETE SET NULL,
    CONSTRAINT fk_nhan_vien_dia_chi FOREIGN KEY (id__dia_chi_nhan_vien) REFERENCES dia_chi_nhan_vien(id) ON DELETE SET NULL
);

-- =============================================================================
-- 4. BẢNG HẠ TẦNG DÃY TRỌ, PHÒNG, TÀI SẢN & SỬA CHỮA
-- =============================================================================

-- Bảng Dãy trọ
-- Cột khóa ngoại ref: id__dia_chi_day_tro
CREATE TABLE day_tro (
    id SERIAL PRIMARY KEY,
    id__nhan_vien INT,                     -- Quản lý phụ trách
    id__dia_chi_day_tro INT,               -- FK: dia_chi_day_tro
    ten_day_tro VARCHAR(100) NOT NULL,
    so_luong_phong INT DEFAULT 0,
    trang_thai VARCHAR(50) DEFAULT 'Đang hoạt động',
    CONSTRAINT fk_day_tro_nhan_vien FOREIGN KEY (id__nhan_vien) REFERENCES nhan_vien(id) ON DELETE SET NULL,
    CONSTRAINT fk_day_tro_dia_chi FOREIGN KEY (id__dia_chi_day_tro) REFERENCES dia_chi_day_tro(id) ON DELETE SET NULL
);

-- Bảng Phòng trọ
CREATE TABLE phong (
    id SERIAL PRIMARY KEY,
    id__day_tro INT NOT NULL,
    ten_phong VARCHAR(50) NOT NULL,
    so_tang INT DEFAULT 1,
    so_tien_tro NUMERIC(12, 2) DEFAULT 0,
    id__trang_thai INT,
    CONSTRAINT fk_phong_day_tro FOREIGN KEY (id__day_tro) REFERENCES day_tro(id) ON DELETE CASCADE,
    CONSTRAINT fk_phong_trang_thai FOREIGN KEY (id__trang_thai) REFERENCES trang_thai_phong(id) ON DELETE SET NULL
);

-- Bảng Tài sản trong phòng
CREATE TABLE tai_san_phong (
    id SERIAL PRIMARY KEY,
    id__phong INT NOT NULL,
    id__phan_loai INT,
    ten_chi_tiet VARCHAR(100) NOT NULL,
    id__tinh_trang INT,
    mo_ta TEXT,
    hinh_anh VARCHAR(255),
    CONSTRAINT fk_tai_san_phong FOREIGN KEY (id__phong) REFERENCES phong(id) ON DELETE CASCADE,
    CONSTRAINT fk_tai_san_phan_loai FOREIGN KEY (id__phan_loai) REFERENCES phan_loai_tai_san(id) ON DELETE SET NULL,
    CONSTRAINT fk_tai_san_tinh_trang FOREIGN KEY (id__tinh_trang) REFERENCES tinh_trang_tai_san(id) ON DELETE SET NULL
);

-- Bảng Nhật ký sửa chữa
CREATE TABLE nhat_ky_sua_chua (
    id SERIAL PRIMARY KEY,
    id__phong INT NOT NULL,
    id__tai_san_phong INT,
    gia_sua NUMERIC(12, 2) DEFAULT 0,
    mo_ta TEXT,
    ngay_sua DATE DEFAULT CURRENT_DATE,
    CONSTRAINT fk_sua_chua_phong FOREIGN KEY (id__phong) REFERENCES phong(id) ON DELETE CASCADE,
    CONSTRAINT fk_sua_chua_tai_san FOREIGN KEY (id__tai_san_phong) REFERENCES tai_san_phong(id) ON DELETE SET NULL
);

-- =============================================================================
-- 5. BẢNG HỢP ĐỒNG, PHƯƠNG TIỆN, ĐIỆN & HÓA ĐƠN
-- =============================================================================

-- Bảng Hợp đồng thuê phòng (id__nhan_vien là Người thuê phòng / Khách thuê)
CREATE TABLE hop_dong (
    id SERIAL PRIMARY KEY,
    id__phong INT NOT NULL,
    id__nhan_vien INT,                     -- Khách thuê phòng (Người đại diện ký HĐ)
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE,
    ky_han_o VARCHAR(50),
    so_nguoi INT DEFAULT 1,
    gia_thue_phong NUMERIC(12, 2) NOT NULL,
    tien_coc NUMERIC(12, 2) DEFAULT 0,
    don_gia_dien NUMERIC(10, 2) DEFAULT 0,
    don_gia_nuoc NUMERIC(10, 2) DEFAULT 0,
    don_gia_dich_vu NUMERIC(10, 2) DEFAULT 0,
    don_gia_gui_xe NUMERIC(10, 2) DEFAULT 0,
    file_chi_tiet_hop_dong VARCHAR(255),
    id__trang_thai INT,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hop_dong_phong FOREIGN KEY (id__phong) REFERENCES phong(id) ON DELETE RESTRICT,
    CONSTRAINT fk_hop_dong_nhan_vien FOREIGN KEY (id__nhan_vien) REFERENCES nhan_vien(id) ON DELETE SET NULL,
    CONSTRAINT fk_hop_dong_trang_thai FOREIGN KEY (id__trang_thai) REFERENCES trang_thai_hop_dong(id) ON DELETE SET NULL
);

-- Bảng Phương tiện của khách thuê
CREATE TABLE phuong_tien (
    id SERIAL PRIMARY KEY,
    id__hop_dong INT NOT NULL,
    hang_xe VARCHAR(50),
    id__loai_xe INT,
    ten_xe VARCHAR(50),
    bien_so_xe VARCHAR(20),
    CONSTRAINT fk_phuong_tien_hop_dong FOREIGN KEY (id__hop_dong) REFERENCES hop_dong(id) ON DELETE CASCADE,
    CONSTRAINT fk_phuong_tien_loai_xe FOREIGN KEY (id__loai_xe) REFERENCES loai_xe(id) ON DELETE SET NULL
);

-- Bảng Điện (Ghi chỉ số điện định kỳ)
CREATE TABLE dien (
    id SERIAL PRIMARY KEY,
    id__phong INT NOT NULL,
    ky_chot VARCHAR(20) NOT NULL,          -- Ví dụ: '2026-09'
    dien_cu NUMERIC(10, 2) NOT NULL,
    dien_moi NUMERIC(10, 2) NOT NULL,
    ngay_chot DATE DEFAULT CURRENT_DATE,
    CONSTRAINT fk_dien_phong FOREIGN KEY (id__phong) REFERENCES phong(id) ON DELETE CASCADE
);

-- Bảng Hóa đơn thu tiền
CREATE TABLE hoa_don (
    id SERIAL PRIMARY KEY,
    id__hop_dong INT NOT NULL,
    id__dien INT,
    ky_thanh_toan VARCHAR(20) NOT NULL,   -- Ví dụ: '2026-09'
    tien_dien NUMERIC(12, 2) DEFAULT 0,   -- (Điện mới - Điện cũ) * Đơn giá điện
    tien_nuoc NUMERIC(12, 2) DEFAULT 0,   -- Đơn giá nước * Số người
    tien_tro NUMERIC(12, 2) DEFAULT 0,    -- Giá thuê phòng
    tien_xe NUMERIC(12, 2) DEFAULT 0,     -- Số lượng xe * Đơn giá gửi xe
    tien_dich_vu NUMERIC(12, 2) DEFAULT 0,
    tong_so_tien NUMERIC(12, 2) NOT NULL,
    anh_thanh_toan VARCHAR(255),
    id__trang_thai INT,
    ngay_nhan_tien DATE,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hoa_don_hop_dong FOREIGN KEY (id__hop_dong) REFERENCES hop_dong(id) ON DELETE RESTRICT,
    CONSTRAINT fk_hoa_don_dien FOREIGN KEY (id__dien) REFERENCES dien(id) ON DELETE SET NULL,
    CONSTRAINT fk_hoa_don_trang_thai FOREIGN KEY (id__trang_thai) REFERENCES trang_thai_hoa_don(id) ON DELETE SET NULL
);

-- =============================================================================
-- 6. CHÈN DỮ LIỆU BAN ĐẦU CHO CÁC BẢNG DANH MỤC
-- =============================================================================

INSERT INTO vai_tro (name) VALUES 
    ('Chủ trọ / Quản trị viên'), 
    ('Quản lý dãy trọ'), 
    ('Nhân viên kỹ thuật'),
    ('Người thuê');

INSERT INTO gioi_tinh (name) VALUES 
    ('Nam'), 
    ('Nữ'), 
    ('Khác');

INSERT INTO trang_thai_phong (name) VALUES 
    ('Phòng trống'), 
    ('Đang có khách thuê'), 
    ('Đang sửa chữa / Bảo trì'), 
    ('Đã đặt cọc giữ chỗ');

INSERT INTO trang_thai_hop_dong (name) VALUES 
    ('Còn hiệu lực'), 
    ('Sắp hết hạn'), 
    ('Đã thanh lý / Kết thúc'), 
    ('Đã hủy');

INSERT INTO trang_thai_hoa_don (name) VALUES 
    ('Chờ thanh toán'), 
    ('Đã thanh toán đủ'), 
    ('Thanh toán một phần'), 
    ('Quá hạn thanh toán');

INSERT INTO phan_loai_tai_san (name) VALUES 
    ('Thiết bị điện lạnh (Điều hòa, Tủ lạnh)'), 
    ('Nội thất gỗ (Giường, Tủ, Bàn ghế)'), 
    ('Thiết bị vệ sinh (Bình nóng lạnh, Vòi sen)'), 
    ('Khóa cửa & An ninh');

INSERT INTO tinh_trang_tai_san (name) VALUES 
    ('Mới 100%'), 
    ('Đang sử dụng tốt'), 
    ('Hao mòn theo thời gian'), 
    ('Hỏng hóc cần sửa chữa');

INSERT INTO loai_xe (name) VALUES 
    ('Xe máy'), 
    ('Xe đạp điện'), 
    ('Xe đạp'), 
    ('Ô tô');

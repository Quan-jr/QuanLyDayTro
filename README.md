# TrọMaster - Hệ Thống Quản Lý Dãy Trọ & Thu Phí Thông Minh

Dự án được xây dựng theo kiến trúc **Modular Monolith** kết hợp **Monorepo** với cơ sở dữ liệu **PostgreSQL**.

---

## 🏛️ Cấu trúc Monorepo

- **`apps/backend`**: Server Node.js / Express theo kiến trúc **Modular Monolith**:
  - `src/modules/danh-muc`: Quản lý danh mục (vai trò, trạng thái, phân loại, loại xe).
  - `src/modules/co-so-vat-chat`: Dãy trọ, Phòng, Tài sản phòng, Nhật ký sửa chữa.
  - `src/modules/hop-dong`: Hợp đồng thuê phòng & Phương tiện xe.
  - `src/modules/dien-nuoc`: Chốt chỉ số điện & đơn giá.
  - `src/modules/hoa-don`: Lập hóa đơn tự động & Quản lý thanh toán.
  - `src/modules/nhan-su`: Nhân viên & Địa chỉ.
  - `src/modules/thong-ke`: Thống kê Dashboard & Doanh thu.
- **`apps/frontend`**: Giao diện Web SPA tốc độ cao (Vite + Modern UI) với đầy đủ chức năng quản lý sơ đồ phòng, chốt điện, xuất hóa đơn.
- **`packages/shared`**: Định dạng tiền tệ VNĐ, hằng số trạng thái dùng chung.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Cấu hình cơ sở dữ liệu PostgreSQL
Đảm bảo PostgreSQL đang chạy và cơ sở dữ liệu `quan_ly_day_tro` đã được tạo (Xem file [schema.sql](file:///d:/QuanLyDayTro/QuanLy/schema.sql)).
Kiểm tra cấu hình kết nối trong file [.env](file:///d:/QuanLyDayTro/QuanLy/.env).

### 2. Chạy ứng dụng đồng thời (Backend + Frontend)
```bash
npm run dev
```

- **Frontend UI:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000/api`

---

## 🛠️ Lệnh Chạy Từng Module Riêng Lẻ

```bash
# Chạy riêng Backend API
npm run dev:backend

# Chạy riêng Frontend Web
npm run dev:frontend
```

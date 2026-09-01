/**
 * Định dạng số thành tiền tệ VNĐ (ví dụ: 2500000 -> 2.500.000 ₫)
 */
export function dinhDangTien(soTien) {
  if (soTien === undefined || soTien === null || isNaN(soTien)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(soTien));
}

/**
 * Định dạng ngày YYYY-MM-DD sang DD/MM/YYYY
 */
export function dinhDangNgay(ngay) {
  if (!ngay) return '';
  const d = new Date(ngay);
  if (isNaN(d.getTime())) return String(ngay);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Tính toán tự động số tiền điện, nước, tổng tiền hóa đơn
 */
export function tinhToanHoaDon({
  dienCu = 0,
  dienMoi = 0,
  donGiaDien = 0,
  soNguoi = 1,
  donGiaNuoc = 0,
  tienTro = 0,
  soLuongXe = 0,
  donGiaXe = 0,
  tienDichVu = 0,
}) {
  const soDienTieuThu = Math.max(0, Number(dienMoi) - Number(dienCu));
  const tienDien = soDienTieuThu * Number(donGiaDien);
  const tienNuoc = Number(soNguoi) * Number(donGiaNuoc);
  const tienXe = Number(soLuongXe) * Number(donGiaXe);
  const tongTien = Number(tienDien) + Number(tienNuoc) + Number(tienTro) + Number(tienXe) + Number(tienDichVu);

  return {
    soDienTieuThu,
    tienDien,
    tienNuoc,
    tienTro: Number(tienTro),
    tienXe,
    tienDichVu: Number(tienDichVu),
    tongTien,
  };
}

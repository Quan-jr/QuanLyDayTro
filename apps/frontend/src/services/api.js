const API_BASE = '/api';

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi xử lý yêu cầu máy chủ');
    }
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Danh mục
  getDanhMuc: () => fetchJson('/danh-muc'),

  // Thống kê
  getDashboardStats: () => fetchJson('/thong-ke/tong-quan'),

  // Dãy trọ
  getDayTro: () => fetchJson('/co-so-vat-chat/day-tro'),
  createDayTro: (payload) =>
    fetchJson('/co-so-vat-chat/day-tro', { method: 'POST', body: JSON.stringify(payload) }),

  // Phòng
  getPhong: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/co-so-vat-chat/phong${query ? `?${query}` : ''}`);
  },
  createPhong: (payload) =>
    fetchJson('/co-so-vat-chat/phong', { method: 'POST', body: JSON.stringify(payload) }),
  updateTrangThaiPhong: (id, id__trang_thai) =>
    fetchJson(`/co-so-vat-chat/phong/${id}/trang-thai`, {
      method: 'PATCH',
      body: JSON.stringify({ id__trang_thai }),
    }),

  // Hợp đồng
  getHopDong: () => fetchJson('/hop-dong'),
  createHopDong: (payload) =>
    fetchJson('/hop-dong', { method: 'POST', body: JSON.stringify(payload) }),
  getPhuongTienHopDong: (id_hop_dong) => fetchJson(`/hop-dong/${id_hop_dong}/phuong-tien`),

  // Chỉ số điện
  getChiSoDien: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/dien-nuoc${query ? `?${query}` : ''}`);
  },
  chotChiSoDien: (payload) =>
    fetchJson('/dien-nuoc', { method: 'POST', body: JSON.stringify(payload) }),
  getChiSoDienGanNhat: (id_phong) => fetchJson(`/dien-nuoc/phong/${id_phong}/gan-nhat`),

  // Hóa đơn
  getHoaDon: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/hoa-don${query ? `?${query}` : ''}`);
  },
  createHoaDon: (payload) =>
    fetchJson('/hoa-don', { method: 'POST', body: JSON.stringify(payload) }),
  capNhatTrangThaiHoaDon: (id, payload) =>
    fetchJson(`/hoa-don/${id}/trang-thai`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Nhân sự
  getNhanVien: () => fetchJson('/nhan-su'),
  createNhanVien: (payload) =>
    fetchJson('/nhan-su', { method: 'POST', body: JSON.stringify(payload) }),

  // Sửa chữa & Tài sản
  getSuaChua: () => fetchJson('/co-so-vat-chat/sua-chua'),
  createSuaChua: (payload) =>
    fetchJson('/co-so-vat-chat/sua-chua', { method: 'POST', body: JSON.stringify(payload) }),
  getTaiSanPhong: (id_phong) => fetchJson(`/co-so-vat-chat/phong/${id_phong}/tai-san`),
  createTaiSan: (payload) =>
    fetchJson('/co-so-vat-chat/tai-san', { method: 'POST', body: JSON.stringify(payload) }),
};

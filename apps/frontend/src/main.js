import { api } from './services/api.js';
import { getListOfProvinces, getDistrictsOfProvince, getWardsOfDistrict } from './services/vietnam-addresses.js';

// Formatters
function dinhDangTien(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return new Intl.NumberFormat('vi-VN').format(Number(n));
}

function dinhDangNgay(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

// App State
let state = {
  currentTab: 'so-do-phong',
  selectedId: null,
  activeFilter: 'all',
  danhMuc: {},
  dayTroList: [],
  phongList: [],
  hopDongList: [],
  dienList: [],
  hoaDonList: [],
  suaChuaList: [],
  nhanVienList: [],
};

// DOM Elements
const masterViewTitle = document.getElementById('master-view-title');
const masterItemCount = document.getElementById('master-item-count');
const masterFilterBar = document.getElementById('master-filter-bar');
const masterTableWrapper = document.getElementById('master-table-wrapper');
const btnMasterAdd = document.getElementById('btn-master-add');
const detailPanel = document.getElementById('detail-panel');
const detailHeaderId = document.getElementById('detail-header-id');
const detailBodyContent = document.getElementById('detail-body-content');
const btnDetailClose = document.getElementById('btn-detail-close');
const btnDetailEdit = document.getElementById('btn-detail-edit');
const btnDetailDelete = document.getElementById('btn-detail-delete');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContainer = document.getElementById('modal-container');

// Toast Notification
function showToast(msg, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${msg}`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Cascading Address Helper (Tỉnh -> Quận/Huyện -> Phường/Xã)
function setupCascadingAddress(container, prefix = '') {
  const selTinh = container.querySelector(`[name="${prefix}tinh"]`);
  const selQuan = container.querySelector(`[name="${prefix}quan_huyen"]`);
  const selPhuong = container.querySelector(`[name="${prefix}phuong_xa"]`);

  if (!selTinh || !selQuan || !selPhuong) return;

  const provinces = getListOfProvinces();
  selTinh.innerHTML = `<option value="">-- Chọn Tỉnh / Thành phố --</option>` + 
    provinces.map(p => `<option value="${p}">${p}</option>`).join('');

  selTinh.onchange = () => {
    const pVal = selTinh.value;
    if (!pVal) {
      selQuan.innerHTML = `<option value="">-- Chọn Quận / Huyện / TP --</option>`;
      selPhuong.innerHTML = `<option value="">-- Chọn Phường / Xã / Thị trấn --</option>`;
      return;
    }
    const districts = getDistrictsOfProvince(pVal);
    selQuan.innerHTML = `<option value="">-- Chọn Quận / Huyện / TP --</option>` + 
      districts.map(d => `<option value="${d}">${d}</option>`).join('');
    selPhuong.innerHTML = `<option value="">-- Chọn Phường / Xã / Thị trấn --</option>`;
  };

  selQuan.onchange = () => {
    const pVal = selTinh.value;
    const dVal = selQuan.value;
    if (!dVal) {
      selPhuong.innerHTML = `<option value="">-- Chọn Phường / Xã / Thị trấn --</option>`;
      return;
    }
    const wards = getWardsOfDistrict(pVal, dVal);
    selPhuong.innerHTML = `<option value="">-- Chọn Phường / Xã / Thị trấn --</option>` + 
      wards.map(w => `<option value="${w}">${w}</option>`).join('');
  };
}

// Record Selection Helper
function selectRecord(id, renderFn) {
  state.selectedId = Number(id);
  masterTableWrapper.querySelectorAll('.master-row').forEach(row => {
    row.classList.toggle('selected', Number(row.dataset.id) === Number(id));
  });
  detailPanel.style.display = 'flex';
  if (typeof renderFn === 'function') {
    renderFn();
  }
}

// Modal Helper (Right Drawer 1/2 Screen)
function openModal(title, htmlContent, onConfirm, onRender) {
  modalContainer.innerHTML = `
    <div class="modal-header">
      <div class="modal-title-group">
        <h3>${title}</h3>
        <p class="modal-subtitle">Vui lòng điền thông tin chi tiết vào biểu mẫu bên dưới</p>
      </div>
      <button class="modal-close" id="btn-close-modal" title="Đóng biểu mẫu"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="modal-form">
      <div class="modal-body">
        ${htmlContent}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" id="btn-cancel-modal">Hủy bỏ</button>
        <button type="submit" class="btn-add-primary" id="btn-submit-modal">
          <i class="fa-solid fa-check"></i> Lưu dữ liệu
        </button>
      </div>
    </form>
  `;

  modalBackdrop.classList.remove('hidden');

  const close = () => modalBackdrop.classList.add('hidden');
  document.getElementById('btn-close-modal').onclick = close;
  document.getElementById('btn-cancel-modal').onclick = close;

  modalBackdrop.onclick = (e) => {
    if (e.target === modalBackdrop) close();
  };

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      close();
      window.removeEventListener('keydown', handleEsc);
    }
  };
  window.addEventListener('keydown', handleEsc);

  if (typeof onRender === 'function') {
    onRender(modalContainer);
  }

  const form = document.getElementById('modal-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-modal');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;
    }
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      await onConfirm(payload, form);
      close();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-check"></i> Lưu dữ liệu`;
      }
    }
  };
}

// =============================================================================
// 1. PHÒNG (Bảng: phong)
// =============================================================================

async function loadPhongView() {
  masterViewTitle.innerText = 'Danh Sách Phòng Trọ';
  btnMasterAdd.innerHTML = `<i class="fa-solid fa-plus"></i> Thêm phòng mới`;
  btnMasterAdd.onclick = openThemPhongModal;

  masterFilterBar.innerHTML = `
    <span class="filter-chip ${state.activeFilter === 'all' ? 'active' : ''}" data-filter="all">Tất cả phòng</span>
    <span class="filter-chip ${state.activeFilter === '1' ? 'active' : ''}" data-filter="1">Phòng trống</span>
    <span class="filter-chip ${state.activeFilter === '2' ? 'active' : ''}" data-filter="2">Đang có khách thuê</span>
    <span class="filter-chip ${state.activeFilter === '3' ? 'active' : ''}" data-filter="3">Đang sửa chữa</span>
    <span class="filter-chip ${state.activeFilter === '4' ? 'active' : ''}" data-filter="4">Đã đặt cọc</span>
  `;

  masterFilterBar.querySelectorAll('.filter-chip').forEach(chip => {
    chip.onclick = () => {
      state.activeFilter = chip.dataset.filter;
      loadPhongView();
    };
  });

  const res = await api.getPhong(state.activeFilter !== 'all' ? { id__trang_thai: state.activeFilter } : {});
  state.phongList = res.data || [];
  masterItemCount.innerText = state.phongList.length;

  if (state.phongList.length > 0 && !state.selectedId) {
    state.selectedId = state.phongList[0].id;
  }

  masterTableWrapper.innerHTML = `
    <table class="master-table">
      <thead>
        <tr>
          <th>Mã phòng</th>
          <th>Tên phòng</th>
          <th>Dãy trọ</th>
          <th>Tầng</th>
          <th>Giá thuê phòng (VNĐ/tháng)</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${state.phongList.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted)">Chưa có phòng nào</td></tr>` : ''}
        ${state.phongList.map(p => {
          const isSelected = p.id === Number(state.selectedId);
          const statusClass = p.id__trang_thai === 1 ? 'success' : p.id__trang_thai === 2 ? 'info' : p.id__trang_thai === 3 ? 'danger' : 'warning';
          return `
            <tr class="master-row ${isSelected ? 'selected' : ''}" data-id="${p.id}">
              <td><strong>#P-${p.id}</strong></td>
              <td><strong style="color:var(--primary-blue); font-size:0.9rem">${p.ten_phong}</strong></td>
              <td><i class="fa-solid fa-building" style="color:var(--text-muted)"></i> ${p.ten_day_tro || 'Chưa gán'}</td>
              <td>Tầng ${p.so_tang}</td>
              <td><strong class="amount-highlight">${dinhDangTien(p.so_tien_tro)}</strong></td>
              <td>
                <span class="status-tag ${statusClass}">
                  <i class="fa-solid fa-circle-dot"></i> ${p.ten_trang_thai || 'Trống'}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  masterTableWrapper.querySelectorAll('.master-row').forEach(row => {
    row.onclick = () => {
      selectRecord(Number(row.dataset.id), renderPhongDetail);
    };
  });

  renderPhongDetail();
}

async function renderPhongDetail() {
  const p = state.phongList.find(item => item.id === Number(state.selectedId));
  if (!p) return;

  detailHeaderId.innerText = `Chi tiết Phòng: ${p.ten_phong}`;
  btnDetailEdit.onclick = () => openDoiTrangThaiPhongModal(p.id);

  let taiSanList = [];
  try {
    const tsRes = await api.getTaiSanPhong(p.id);
    taiSanList = tsRes.data || [];
  } catch (e) {}

  detailBodyContent.innerHTML = `
    <div class="detail-field-group">
      <div class="detail-row">
        <span class="detail-label">Mã phòng</span>
        <span class="detail-val">#P-${p.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tên phòng</span>
        <span class="detail-val"><strong>${p.ten_phong}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Thuộc Dãy trọ</span>
        <span class="detail-val link"><i class="fa-solid fa-building"></i> ${p.ten_day_tro || 'Chưa gán'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vị trí</span>
        <span class="detail-val">Tầng ${p.so_tang}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Giá thuê niêm yết</span>
        <span class="detail-val amount-highlight" style="font-size:1.05rem">${dinhDangTien(p.so_tien_tro)} VNĐ/tháng</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Trạng thái hiện tại</span>
        <span class="detail-val">
          <span class="status-tag ${p.id__trang_thai === 1 ? 'success' : p.id__trang_thai === 2 ? 'info' : p.id__trang_thai === 3 ? 'danger' : 'warning'}">
            ${p.ten_trang_thai}
          </span>
        </span>
      </div>
    </div>

    <!-- SUB TABLE: TÀI SẢN PHÒNG -->
    <div class="subtable-section">
      <div class="subtable-header">
        <span class="subtable-title">Trang thiết bị & Tài sản <span class="badge">${taiSanList.length} món</span></span>
      </div>

      <table class="sub-table">
        <thead>
          <tr>
            <th>Tên thiết bị</th>
            <th>Phân loại</th>
            <th>Tình trạng</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${taiSanList.length === 0 ? `<tr><td colspan="4" style="text-align:center; padding:1rem; color:var(--text-muted)">Chưa có trang thiết bị nào được bàn giao</td></tr>` : ''}
          ${taiSanList.map(ts => `
            <tr>
              <td><strong>${ts.ten_chi_tiet}</strong></td>
              <td>${ts.ten_phan_loai || '-'}</td>
              <td><span class="status-tag success">${ts.ten_tinh_trang || 'Đang dùng tốt'}</span></td>
              <td><small>${ts.mo_ta || '-'}</small></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="subtable-footer-links">
        <a class="subtable-link" id="link-add-asset"><i class="fa-solid fa-plus"></i> Bàn giao thêm thiết bị</a>
      </div>
    </div>

    ${p.id__trang_thai === 1 ? `
      <div style="margin-top: 1.5rem">
        <button class="btn-add-primary" id="btn-create-contract-shortcut" style="width:100%; justify-content:center; padding: 0.6rem">
          <i class="fa-solid fa-file-contract"></i> Lập hợp đồng cho thuê phòng này
        </button>
      </div>
    ` : `
      <div style="margin-top: 1.5rem; display:flex; gap:0.5rem">
        <button class="btn-add-primary" id="btn-record-elec-shortcut" style="flex:1; justify-content:center;">
          <i class="fa-solid fa-bolt"></i> Chốt chỉ số điện kỳ này
        </button>
      </div>
    `}
  `;

  document.getElementById('link-add-asset')?.addEventListener('click', () => openThemTaiSanModal(p.id, p.ten_phong));
  document.getElementById('btn-create-contract-shortcut')?.addEventListener('click', () => openTaoHopDongModal(p.id, p.ten_phong, p.so_tien_tro));
  document.getElementById('btn-record-elec-shortcut')?.addEventListener('click', () => openGhiDienModal(p.id, p.ten_phong));
}

// =============================================================================
// 2. HỢP ĐỒNG (Bảng: hop_dong)
// =============================================================================

async function loadHopDongView() {
  masterViewTitle.innerText = 'Hợp Đồng Thuê Phòng';
  btnMasterAdd.innerHTML = `<i class="fa-solid fa-plus"></i> Tạo hợp đồng mới`;
  btnMasterAdd.onclick = () => openTaoHopDongModal();
  masterFilterBar.innerHTML = `<span class="filter-chip active">Tất cả Hợp Đồng</span>`;

  const res = await api.getHopDong();
  state.hopDongList = res.data || [];
  masterItemCount.innerText = state.hopDongList.length;

  if (state.hopDongList.length > 0 && !state.selectedId) {
    state.selectedId = state.hopDongList[0].id;
  }

  masterTableWrapper.innerHTML = `
    <table class="master-table">
      <thead>
        <tr>
          <th>Mã hợp đồng</th>
          <th>Phòng thuê</th>
          <th>Dãy trọ</th>
          <th>Người thuê phòng (Khách thuê)</th>
          <th>SĐT Khách thuê</th>
          <th>Ngày bắt đầu</th>
          <th>Ngày kết thúc</th>
          <th>Thời hạn</th>
          <th>Số người</th>
          <th>Giá thuê phòng</th>
          <th>Tiền cọc</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${state.hopDongList.length === 0 ? `<tr><td colspan="12" style="text-align:center; padding:2rem; color:var(--text-muted)">Chưa có hợp đồng nào</td></tr>` : ''}
        ${state.hopDongList.map(hd => {
          const isSelected = hd.id === Number(state.selectedId);
          return `
            <tr class="master-row ${isSelected ? 'selected' : ''}" data-id="${hd.id}">
              <td><strong>#HĐ-${hd.id}</strong></td>
              <td><strong style="color:var(--primary-blue)">${hd.ten_phong}</strong></td>
              <td>${hd.ten_day_tro}</td>
              <td><strong style="color:#0f172a"><i class="fa-solid fa-user" style="color:var(--primary-blue); font-size:0.8rem"></i> ${hd.ten_khach_thue || 'Khách vãng lai'}</strong></td>
              <td>${hd.sdt_khach_thue || '-'}</td>
              <td><span style="color:var(--primary-blue); font-weight:600">${dinhDangNgay(hd.ngay_bat_dau)}</span></td>
              <td>${dinhDangNgay(hd.ngay_ket_thuc)}</td>
              <td>${hd.ky_han_o || '6 tháng'}</td>
              <td>${hd.so_nguoi || 1} người</td>
              <td><strong class="amount-highlight">${dinhDangTien(hd.gia_thue_phong)}</strong></td>
              <td>${dinhDangTien(hd.tien_coc)}</td>
              <td><span class="status-tag success"><i class="fa-solid fa-check"></i> ${hd.ten_trang_thai || 'Hiệu lực'}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  masterTableWrapper.querySelectorAll('.master-row').forEach(row => {
    row.onclick = () => {
      selectRecord(Number(row.dataset.id), renderHopDongDetail);
    };
  });

  renderHopDongDetail();
}

async function renderHopDongDetail() {
  const hd = state.hopDongList.find(item => item.id === Number(state.selectedId));
  if (!hd) return;

  detailHeaderId.innerText = `Hợp Đồng: #HĐ-${hd.id} - ${hd.ten_phong}`;

  let ptList = [];
  try {
    const ptRes = await api.getPhuongTienHopDong(hd.id);
    ptList = ptRes.data || [];
  } catch (e) {}

  detailBodyContent.innerHTML = `
    <div class="detail-field-group">
      <div class="detail-row">
        <span class="detail-label">Mã hợp đồng</span>
        <span class="detail-val">#HĐ-${hd.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phòng thuê</span>
        <span class="detail-val link"><strong>${hd.ten_phong}</strong> (${hd.ten_day_tro})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Người thuê (Khách đại diện)</span>
        <span class="detail-val"><strong>${hd.ten_khach_thue || 'Chưa gán'}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Số điện thoại liên hệ</span>
        <span class="detail-val link">${hd.sdt_khach_thue || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Số CCCD / Định danh</span>
        <span class="detail-val">${hd.cccd_khach_thue || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ngày bắt đầu</span>
        <span class="detail-val date-blue">${dinhDangNgay(hd.ngay_bat_dau)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ngày kết thúc</span>
        <span class="detail-val">${dinhDangNgay(hd.ngay_ket_thuc)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Kỳ hạn thuê</span>
        <span class="detail-val">${hd.ky_han_o || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Số người ở</span>
        <span class="detail-val"><strong>${hd.so_nguoi || 1} người</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Giá thuê phòng</span>
        <span class="detail-val amount-highlight">${dinhDangTien(hd.gia_thue_phong)} VNĐ/tháng</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tiền đặt cọc</span>
        <span class="detail-val">${dinhDangTien(hd.tien_coc)} VNĐ</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Đơn giá điện</span>
        <span class="detail-val">${dinhDangTien(hd.don_gia_dien)} VNĐ/kWh</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Đơn giá nước</span>
        <span class="detail-val">${dinhDangTien(hd.don_gia_nuoc)} VNĐ/người/tháng</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Dịch vụ chung</span>
        <span class="detail-val">${dinhDangTien(hd.don_gia_dich_vu)} VNĐ</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Đơn giá gửi xe</span>
        <span class="detail-val">${dinhDangTien(hd.don_gia_gui_xe)} VNĐ/xe</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">File hợp đồng</span>
        <span class="detail-val" style="color:var(--text-muted)">${hd.file_chi_tiet_hop_dong || 'Chưa đính kèm'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Trạng thái</span>
        <span class="detail-val"><span class="status-tag success">${hd.ten_trang_thai || 'Hiệu lực'}</span></span>
      </div>
    </div>

    <!-- SUB TABLE: PHƯƠNG TIỆN -->
    <div class="subtable-section">
      <div class="subtable-header">
        <span class="subtable-title">Phương tiện đăng ký gửi <span class="badge">${ptList.length} xe</span></span>
      </div>

      <table class="sub-table">
        <thead>
          <tr>
            <th>Hãng xe</th>
            <th>Loại xe</th>
            <th>Tên xe</th>
            <th>Biển số xe</th>
          </tr>
        </thead>
        <tbody>
          ${ptList.length === 0 ? `<tr><td colspan="4" style="text-align:center; padding:1rem; color:var(--text-muted)">Chưa có phương tiện nào đăng ký</td></tr>` : ''}
          ${ptList.map(xe => `
            <tr>
              <td>${xe.hang_xe || '-'}</td>
              <td>${xe.ten_loai_xe || 'Xe máy'}</td>
              <td><strong>${xe.ten_xe}</strong></td>
              <td><strong style="color:var(--primary-blue)">${xe.bien_so_xe}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// =============================================================================
// 3. DÃY TRỌ (Bảng: day_tro)
// =============================================================================

async function loadDayTroView() {
  masterViewTitle.innerText = 'Danh Sách Dãy Trọ';
  btnMasterAdd.innerHTML = `<i class="fa-solid fa-plus"></i> Thêm Dãy Trọ Mới`;
  btnMasterAdd.onclick = openThemDayTroModal;
  masterFilterBar.innerHTML = `<span class="filter-chip active">Tất cả dãy trọ</span>`;

  const res = await api.getDayTro();
  state.dayTroList = res.data || [];
  masterItemCount.innerText = state.dayTroList.length;

  if (state.dayTroList.length > 0 && !state.selectedId) {
    state.selectedId = state.dayTroList[0].id;
  }

  masterTableWrapper.innerHTML = `
    <table class="master-table">
      <thead>
        <tr>
          <th>Mã dãy</th>
          <th>Tên dãy trọ</th>
          <th>Người quản lý</th>
          <th>Địa chỉ</th>
          <th>Số lượng phòng</th>
          <th>Trạng thái hoạt động</th>
        </tr>
      </thead>
      <tbody>
        ${state.dayTroList.map(dt => {
          const isSelected = dt.id === Number(state.selectedId);
          return `
            <tr class="master-row ${isSelected ? 'selected' : ''}" data-id="${dt.id}">
              <td><strong>#DT-${dt.id}</strong></td>
              <td><strong style="color:var(--primary-blue); font-size:0.9rem">${dt.ten_day_tro}</strong></td>
              <td><i class="fa-solid fa-user-tie" style="color:var(--text-muted)"></i> ${dt.ten_quan_ly || 'Chưa phân công'}</td>
              <td>${[dt.chi_tiet_ngo_so_nha, dt.thanh_pho_quan_huyen_xa, dt.tinh].filter(Boolean).join(', ') || '-'}</td>
              <td><strong style="color:#0f172a">${dt.so_luong_phong} phòng</strong> <small style="color:var(--text-muted)">(${dt.so_phong_dang_thue} thuê / ${dt.so_phong_trong} trống)</small></td>
              <td><span class="status-tag success"><i class="fa-solid fa-circle-check"></i> ${dt.trang_thai}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  masterTableWrapper.querySelectorAll('.master-row').forEach(row => {
    row.onclick = () => {
      selectRecord(Number(row.dataset.id), renderDayTroDetail);
    };
  });

  renderDayTroDetail();
}

function renderDayTroDetail() {
  const dt = state.dayTroList.find(item => item.id === Number(state.selectedId));
  if (!dt) return;

  detailHeaderId.innerText = `Dãy Trọ: ${dt.ten_day_tro}`;

  detailBodyContent.innerHTML = `
    <div class="detail-field-group">
      <div class="detail-row">
        <span class="detail-label">Mã dãy trọ</span>
        <span class="detail-val">#DT-${dt.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tên dãy trọ</span>
        <span class="detail-val"><strong>${dt.ten_day_tro}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Người quản lý</span>
        <span class="detail-val link">${dt.ten_quan_ly || 'Chưa phân công'} ${dt.sdt_quan_ly ? `(${dt.sdt_quan_ly})` : ''}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Địa chỉ vị trí</span>
        <span class="detail-val">${[dt.chi_tiet_ngo_so_nha, dt.thanh_pho_quan_huyen_xa, dt.tinh].filter(Boolean).join(', ') || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quy mô thiết kế</span>
        <span class="detail-val"><strong>${dt.so_luong_phong} phòng</strong> (Đang vận hành: ${dt.tong_so_phong_thuc_te} phòng)</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Trạng thái</span>
        <span class="detail-val"><span class="status-tag success">${dt.trang_thai}</span></span>
      </div>
    </div>
  `;
}

// =============================================================================
// 4. ĐIỆN (Bảng: dien)
// =============================================================================

async function loadDienView() {
  masterViewTitle.innerText = 'Chốt Chỉ Số Điện';
  btnMasterAdd.innerHTML = `<i class="fa-solid fa-plus"></i> Ghi chỉ số điện`;
  btnMasterAdd.onclick = () => openGhiDienModal();
  masterFilterBar.innerHTML = `<span class="filter-chip active">Tất cả kỳ chốt điện</span>`;

  const res = await api.getChiSoDien();
  state.dienList = res.data || [];
  masterItemCount.innerText = state.dienList.length;

  if (state.dienList.length > 0 && !state.selectedId) {
    state.selectedId = state.dienList[0].id;
  }

  masterTableWrapper.innerHTML = `
    <table class="master-table">
      <thead>
        <tr>
          <th>Mã chốt</th>
          <th>Phòng trọ</th>
          <th>Dãy trọ</th>
          <th>Kỳ chốt</th>
          <th>Chỉ số điện cũ (kWh)</th>
          <th>Chỉ số điện mới (kWh)</th>
          <th>Lượng tiêu thụ (kWh)</th>
          <th>Ngày ghi nhận</th>
        </tr>
      </thead>
      <tbody>
        ${state.dienList.length === 0 ? `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted)">Chưa có dữ liệu chốt điện</td></tr>` : ''}
        ${state.dienList.map(d => {
          const isSelected = d.id === Number(state.selectedId);
          return `
            <tr class="master-row ${isSelected ? 'selected' : ''}" data-id="${d.id}">
              <td><strong>#Đ-${d.id}</strong></td>
              <td><strong style="color:var(--primary-blue)">${d.ten_phong}</strong></td>
              <td>${d.ten_day_tro}</td>
              <td><strong style="color:var(--primary-blue)">${d.ky_chot}</strong></td>
              <td>${d.dien_cu}</td>
              <td>${d.dien_moi}</td>
              <td><strong style="color:var(--color-warning)">${d.so_dien_tieu_thu} kWh</strong></td>
              <td>${dinhDangNgay(d.ngay_chot)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  masterTableWrapper.querySelectorAll('.master-row').forEach(row => {
    row.onclick = () => {
      selectRecord(Number(row.dataset.id), renderDienDetail);
    };
  });

  renderDienDetail();
}

function renderDienDetail() {
  const d = state.dienList.find(item => item.id === Number(state.selectedId));
  if (!d) return;

  detailHeaderId.innerText = `Chốt điện: ${d.ten_phong} (Kỳ ${d.ky_chot})`;

  detailBodyContent.innerHTML = `
    <div class="detail-field-group">
      <div class="detail-row">
        <span class="detail-label">Mã ghi điện</span>
        <span class="detail-val">#Đ-${d.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phòng trọ</span>
        <span class="detail-val link"><strong>${d.ten_phong}</strong> (${d.ten_day_tro})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Kỳ chốt tháng</span>
        <span class="detail-val date-blue">${d.ky_chot}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Chỉ số cũ</span>
        <span class="detail-val">${d.dien_cu} kWh</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Chỉ số mới</span>
        <span class="detail-val">${d.dien_moi} kWh</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tổng lượng tiêu thụ</span>
        <span class="detail-val" style="color:var(--color-warning); font-size:1.1rem; font-weight:700">${d.so_dien_tieu_thu} kWh</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ngày chốt số</span>
        <span class="detail-val">${dinhDangNgay(d.ngay_chot)}</span>
      </div>
    </div>
  `;
}

// =============================================================================
// 5. HÓA ĐƠN (Bảng: hoa_don)
// =============================================================================

async function loadHoaDonView() {
  masterViewTitle.innerText = 'Hóa Đơn Thu Tiền Hàng Tháng';
  btnMasterAdd.innerHTML = `<i class="fa-solid fa-plus"></i> Lập hóa đơn mới`;
  btnMasterAdd.onclick = openTaoHoaDonModal;

  masterFilterBar.innerHTML = `
    <span class="filter-chip ${state.activeFilter === 'all' ? 'active' : ''}" data-filter="all">Tất cả hóa đơn</span>
    <span class="filter-chip ${state.activeFilter === '1' ? 'active' : ''}" data-filter="1">Chờ thanh toán</span>
    <span class="filter-chip ${state.activeFilter === '2' ? 'active' : ''}" data-filter="2">Đã thanh toán</span>
    <span class="filter-chip ${state.activeFilter === '4' ? 'active' : ''}" data-filter="4">Quá hạn</span>
  `;

  masterFilterBar.querySelectorAll('.filter-chip').forEach(chip => {
    chip.onclick = () => {
      state.activeFilter = chip.dataset.filter;
      loadHoaDonView();
    };
  });

  const res = await api.getHoaDon(state.activeFilter !== 'all' ? { id__trang_thai: state.activeFilter } : {});
  state.hoaDonList = res.data || [];
  masterItemCount.innerText = state.hoaDonList.length;

  if (state.hoaDonList.length > 0 && !state.selectedId) {
    state.selectedId = state.hoaDonList[0].id;
  }

  masterTableWrapper.innerHTML = `
    <table class="master-table">
      <thead>
        <tr>
          <th>Mã hóa đơn</th>
          <th>Hợp đồng</th>
          <th>Phòng / Dãy trọ</th>
          <th>Kỳ thanh toán</th>
          <th>Tiền phòng</th>
          <th>Tiền điện</th>
          <th>Tiền nước</th>
          <th>Tiền xe</th>
          <th>Tiền dịch vụ</th>
          <th>Tổng cộng (VNĐ)</th>
          <th>Trạng thái</th>
          <th>Ngày nhận tiền</th>
        </tr>
      </thead>
      <tbody>
        ${state.hoaDonList.length === 0 ? `<tr><td colspan="12" style="text-align:center; padding:2rem; color:var(--text-muted)">Chưa có hóa đơn nào</td></tr>` : ''}
        ${state.hoaDonList.map(hd => {
          const isSelected = hd.id === Number(state.selectedId);
          const statusClass = hd.id__trang_thai === 1 ? 'danger' : hd.id__trang_thai === 2 ? 'success' : 'warning';
          const statusIcon = hd.id__trang_thai === 1 ? 'fa-rotate' : hd.id__trang_thai === 2 ? 'fa-check' : 'fa-hourglass-half';
          
          return `
            <tr class="master-row ${isSelected ? 'selected' : ''}" data-id="${hd.id}">
              <td><strong>#HD-${hd.id}</strong></td>
              <td>#HĐ-${hd.id__hop_dong}</td>
              <td><strong>${hd.ten_phong}</strong> <small style="color:var(--text-muted)">(${hd.ten_day_tro})</small></td>
              <td><strong style="color:var(--primary-blue)">${hd.ky_thanh_toan}</strong></td>
              <td>${dinhDangTien(hd.tien_tro)}</td>
              <td>${dinhDangTien(hd.tien_dien)}</td>
              <td>${dinhDangTien(hd.tien_nuoc)}</td>
              <td>${dinhDangTien(hd.tien_xe)}</td>
              <td>${dinhDangTien(hd.tien_dich_vu)}</td>
              <td><strong class="amount-highlight">${dinhDangTien(hd.tong_so_tien)}</strong></td>
              <td>
                <span class="status-tag ${statusClass}">
                  <i class="fa-solid ${statusIcon}"></i> ${hd.ten_trang_thai || 'Chờ thanh toán'}
                </span>
              </td>
              <td>${hd.ngay_nhan_tien ? dinhDangNgay(hd.ngay_nhan_tien) : '-'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  masterTableWrapper.querySelectorAll('.master-row').forEach(row => {
    row.onclick = () => {
      selectRecord(Number(row.dataset.id), renderHoaDonDetail);
    };
  });

  renderHoaDonDetail();
}

function renderHoaDonDetail() {
  const hd = state.hoaDonList.find(item => item.id === Number(state.selectedId));
  if (!hd) return;

  detailHeaderId.innerText = `Hóa đơn: #HD-${hd.id} - ${hd.ten_phong}`;
  btnDetailEdit.onclick = () => openChinhSuaHoaDonModal(hd);

  detailBodyContent.innerHTML = `
    <div class="detail-field-group">
      <div class="detail-row">
        <span class="detail-label">Mã hóa đơn</span>
        <span class="detail-val">#HD-${hd.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phòng / Hợp đồng</span>
        <span class="detail-val link">Phòng ${hd.ten_phong} (#HĐ-${hd.id__hop_dong} - ${hd.ten_day_tro})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Chỉ số điện chốt</span>
        <span class="detail-val">${hd.id__dien ? `#Đ-${hd.id__dien} (${hd.so_dien_tieu_thu || 0} kWh)` : 'Không kèm số điện'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Kỳ thanh toán</span>
        <span class="detail-val date-blue">${hd.ky_thanh_toan}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Trạng thái</span>
        <span class="detail-val">
          <span class="status-tag ${hd.id__trang_thai === 2 ? 'success' : hd.id__trang_thai === 1 ? 'danger' : 'warning'}">
            ${hd.ten_trang_thai}
          </span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ngày nhận tiền</span>
        <span class="detail-val">${hd.ngay_nhan_tien ? dinhDangNgay(hd.ngay_nhan_tien) : 'Chưa nhận tiền'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ảnh thanh toán</span>
        <span class="detail-val" style="color:var(--text-muted)">${hd.anh_thanh_toan || 'Chưa tải ảnh'}</span>
      </div>
    </div>

    <!-- SUB TABLE: CHI TIẾT TÍNH TIỀN -->
    <div class="subtable-section">
      <div class="subtable-header">
        <span class="subtable-title">Chi tiết các khoản thu tháng ${hd.ky_thanh_toan}</span>
      </div>

      <table class="sub-table">
        <thead>
          <tr>
            <th>Khoản thu</th>
            <th>Diễn giải</th>
            <th>Số tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Tiền phòng trọ</strong></td>
            <td>Theo giá hợp đồng</td>
            <td><strong>${dinhDangTien(hd.tien_tro)}</strong></td>
          </tr>
          <tr>
            <td><strong>Tiền điện</strong></td>
            <td>${hd.so_dien_tieu_thu || 0} kWh tiêu thụ</td>
            <td><strong>${dinhDangTien(hd.tien_dien)}</strong></td>
          </tr>
          <tr>
            <td><strong>Tiền nước sinh hoạt</strong></td>
            <td>${hd.so_nguoi || 1} người ở</td>
            <td><strong>${dinhDangTien(hd.tien_nuoc)}</strong></td>
          </tr>
          <tr>
            <td><strong>Tiền gửi xe</strong></td>
            <td>Phương tiện đăng ký</td>
            <td><strong>${dinhDangTien(hd.tien_xe)}</strong></td>
          </tr>
          <tr>
            <td><strong>Dịch vụ chung</strong></td>
            <td>Vệ sinh, rác, wifi</td>
            <td><strong>${dinhDangTien(hd.tien_dich_vu)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="detail-summary-list">
      <div class="detail-row">
        <span class="detail-label" style="font-size:0.95rem; font-weight:700">Tổng cộng phải thu</span>
        <span class="detail-val amount-highlight" style="font-size:1.2rem">${dinhDangTien(hd.tong_so_tien)} VNĐ</span>
      </div>
    </div>

    ${hd.id__trang_thai !== 2 ? `
      <div style="margin-top: 1.5rem">
        <button class="btn-add-primary" id="btn-confirm-pay" style="width:100%; justify-content:center; padding: 0.6rem">
          <i class="fa-solid fa-circle-check"></i> Xác nhận đã nhận tiền (${dinhDangTien(hd.tong_so_tien)} VNĐ)
        </button>
      </div>
    ` : ''}
  `;

  document.getElementById('btn-confirm-pay')?.addEventListener('click', async () => {
    await api.capNhatTrangThaiHoaDon(hd.id, { id__trang_thai: 2 });
    showToast(`Đã thu tiền hóa đơn #HD-${hd.id}`);
    loadHoaDonView();
  });
}

// =============================================================================
// 6. NHẬT KÝ SỬA CHỮA (Bảng: nhat_ky_sua_chua)
// =============================================================================

async function loadTaiSanView() {
  masterViewTitle.innerText = 'Bảo Trì & Nhật Ký Sửa Chữa';
  btnMasterAdd.innerHTML = `<i class="fa-solid fa-plus"></i> Ghi nhận sửa chữa`;
  btnMasterAdd.onclick = () => {
    openModal('Ghi Nhận Lịch Sử Bảo Trì / Sửa Chữa', `
      <div class="form-grid">
        <div class="form-group full">
          <label>Chọn phòng cần sửa *</label>
          <select name="id__phong" class="select-control" required>
            ${state.phongList.map(p => `<option value="${p.id}">Phòng ${p.ten_phong} (${p.ten_day_tro || ''})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Chi phí sửa chữa (VNĐ) *</label>
          <input type="number" name="gia_sua" class="input-control" placeholder="350000" required />
        </div>
        <div class="form-group">
          <label>Ngày sửa chữa</label>
          <input type="date" name="ngay_sua" class="input-control" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group full">
          <label>Nội dung mô tả sửa chữa *</label>
          <textarea name="mo_ta" class="input-control" rows="3" placeholder="Mô tả hỏng hóc và linh kiện thay thế..." required></textarea>
        </div>
      </div>
    `, async (payload) => {
      await api.createSuaChua(payload);
      showToast('Ghi nhận sửa chữa thành công!');
      loadTaiSanView();
    });
  };

  masterFilterBar.innerHTML = `<span class="filter-chip active">Tất cả lịch sử sửa chữa</span>`;

  const res = await api.getSuaChua();
  state.suaChuaList = res.data || [];
  masterItemCount.innerText = state.suaChuaList.length;

  if (state.suaChuaList.length > 0 && !state.selectedId) {
    state.selectedId = state.suaChuaList[0].id;
  }

  masterTableWrapper.innerHTML = `
    <table class="master-table">
      <thead>
        <tr>
          <th>Mã ghi nhận</th>
          <th>Phòng trọ</th>
          <th>Thiết bị / Hạng mục</th>
          <th>Chi phí sửa chữa (VNĐ)</th>
          <th>Nội dung mô tả</th>
          <th>Ngày sửa chữa</th>
        </tr>
      </thead>
      <tbody>
        ${state.suaChuaList.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted)">Chưa có dữ liệu sửa chữa</td></tr>` : ''}
        ${state.suaChuaList.map(sc => {
          const isSelected = sc.id === Number(state.selectedId);
          return `
            <tr class="master-row ${isSelected ? 'selected' : ''}" data-id="${sc.id}">
              <td><strong>#NK-${sc.id}</strong></td>
              <td><strong style="color:var(--primary-blue)">${sc.ten_phong}</strong> <small style="color:var(--text-muted)">(${sc.ten_day_tro})</small></td>
              <td>${sc.ten_tai_san || 'Cơ sở hạ tầng'}</td>
              <td><strong class="amount-highlight">${dinhDangTien(sc.gia_sua)}</strong></td>
              <td>${sc.mo_ta}</td>
              <td>${dinhDangNgay(sc.ngay_sua)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  masterTableWrapper.querySelectorAll('.master-row').forEach(row => {
    row.onclick = () => {
      selectRecord(Number(row.dataset.id), renderTaiSanDetail);
    };
  });

  renderTaiSanDetail();
}

function renderTaiSanDetail() {
  const sc = state.suaChuaList.find(item => item.id === Number(state.selectedId));
  if (!sc) return;

  detailHeaderId.innerText = `Sửa chữa: #NK-${sc.id} - ${sc.ten_phong}`;

  detailBodyContent.innerHTML = `
    <div class="detail-field-group">
      <div class="detail-row">
        <span class="detail-label">Mã phiếu sửa</span>
        <span class="detail-val">#NK-${sc.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phòng thực hiện</span>
        <span class="detail-val link"><strong>${sc.ten_phong}</strong> (${sc.ten_day_tro})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Hạng mục / Thiết bị</span>
        <span class="detail-val"><strong>${sc.ten_tai_san || 'Hệ thống hạ tầng'}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Chi phí sửa chữa</span>
        <span class="detail-val amount-highlight" style="font-size:1.15rem">${dinhDangTien(sc.gia_sua)} VNĐ</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ngày thực hiện</span>
        <span class="detail-val date-blue">${dinhDangNgay(sc.ngay_sua)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Nội dung chi tiết</span>
        <span class="detail-val">${sc.mo_ta || '-'}</span>
      </div>
    </div>
  `;
}

// ==========================================
// MODAL DIALOGS
// ==========================================

function openThemPhongModal() {
  openModal('Thêm Phòng Trọ Mới', `
    <div class="form-grid">
      <div class="form-group full">
        <label>Chọn Dãy Trọ *</label>
        <select name="id__day_tro" class="select-control" required>
          ${state.dayTroList.map(dt => `<option value="${dt.id}">${dt.ten_day_tro}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Tên / Số phòng *</label>
        <input type="text" name="ten_phong" class="input-control" placeholder="P.101" required />
      </div>
      <div class="form-group">
        <label>Vị trí tầng</label>
        <input type="number" name="so_tang" class="input-control" value="1" />
      </div>
      <div class="form-group full">
        <label>Giá thuê phòng (VNĐ/tháng) *</label>
        <input type="number" name="so_tien_tro" class="input-control" placeholder="2800000" required />
      </div>
    </div>
  `, async (payload) => {
    await api.createPhong(payload);
    showToast('Thêm phòng thành công!');
    loadPhongView();
  });
}

function openThemDayTroModal() {
  openModal('Thêm Dãy Trọ Mới', `
    <div class="form-grid">
      <div class="form-group full">
        <label>Tên dãy trọ *</label>
        <input type="text" name="ten_day_tro" class="input-control" placeholder="Ví dụ: Dãy Trọ Xanh" required />
      </div>
      <div class="form-group">
        <label>Số lượng phòng</label>
        <input type="number" name="so_luong_phong" class="input-control" value="10" />
      </div>
      <div class="form-group">
        <label>Người quản lý phụ trách</label>
        <select name="id__nhan_vien" class="select-control">
          <option value="">-- Chưa chọn --</option>
          ${state.nhanVienList.map(nv => `<option value="${nv.id}">${nv.ho_va_ten}</option>`).join('')}
        </select>
      </div>

      <!-- ĐỊA CHỈ DÃY TRỌ (CASCADING DROPDOWN) -->
      <div class="form-group full" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; margin-top: 0.5rem;">
        <label style="font-weight: 700; color: var(--primary-blue); font-size: 0.95rem;">
          <i class="fa-solid fa-map-location-dot"></i> Địa Chỉ Vị Trí Dãy Trọ
        </label>
      </div>

      <div class="form-group">
        <label>Tỉnh / Thành phố *</label>
        <select name="tinh" class="select-control" required>
          <option value="">-- Đang tải danh sách tỉnh --</option>
        </select>
      </div>

      <div class="form-group">
        <label>Quận / Huyện / TP trực thuộc *</label>
        <select name="quan_huyen" class="select-control" required>
          <option value="">-- Chọn Tỉnh trước --</option>
        </select>
      </div>

      <div class="form-group full">
        <label>Phường / Xã / Thị trấn *</label>
        <select name="phuong_xa" class="select-control" required>
          <option value="">-- Chọn Quận/Huyện trước --</option>
        </select>
      </div>

      <div class="form-group full">
        <label>Địa chỉ chi tiết (Số nhà, ngõ, ngách, tên đường) *</label>
        <input type="text" name="chi_tiet_ngo_so_nha" class="input-control" placeholder="Ví dụ: Số 15, Ngõ 80 Phố Trần Thái Tông" required />
      </div>
    </div>
  `, async (payload) => {
    // Ghép Quận Huyện và Phường Xã thành trường thanh_pho_quan_huyen_xa
    const combinedDistrictWard = [payload.quan_huyen, payload.phuong_xa].filter(Boolean).join(', ');
    const dayTroData = {
      ten_day_tro: payload.ten_day_tro,
      so_luong_phong: payload.so_luong_phong,
      id__nhan_vien: payload.id__nhan_vien || null,
      tinh: payload.tinh,
      thanh_pho_quan_huyen_xa: combinedDistrictWard,
      chi_tiet_ngo_so_nha: payload.chi_tiet_ngo_so_nha,
    };
    await api.createDayTro(dayTroData);
    showToast('Thêm dãy trọ thành công!');
    loadDayTroView();
  }, (container) => {
    setupCascadingAddress(container);
  });
}

function openTaoHopDongModal(idPhong, tenPhong, giaThue) {
  openModal('Lập Hợp Đồng & Tạo Hồ Sơ Khách Thuê Mới', `
    <div class="form-grid">
      <!-- 1. THÔNG TIN PHÒNG -->
      <div class="form-group full" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 0.25rem;">
        <label style="font-weight: 700; color: var(--primary-blue); font-size: 0.95rem;">
          <i class="fa-solid fa-door-open"></i> 1. Thông Tin Phòng Thuê
        </label>
      </div>

      <div class="form-group full">
        <label>Phòng cho thuê *</label>
        <select name="id__phong" class="select-control" required>
          ${state.phongList.map(p => `<option value="${p.id}" ${p.id === Number(idPhong) ? 'selected' : ''}>Phòng ${p.ten_phong} (${p.ten_day_tro || ''}) - Giá niêm yết: ${dinhDangTien(p.so_tien_tro)} đ</option>`).join('')}
        </select>
      </div>

      <!-- 2. THÔNG TIN KHÁCH THUÊ PHÒNG (BẮT BUỘC NHẬP MỚI) -->
      <div class="form-group full" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-top: 0.5rem; margin-bottom: 0.25rem;">
        <label style="font-weight: 700; color: var(--primary-blue); font-size: 0.95rem;">
          <i class="fa-solid fa-user-plus"></i> 2. Thông Tin Khách Thuê Phòng (Tạo Mới)
        </label>
      </div>

      <div class="form-group">
        <label>Họ và tên khách thuê *</label>
        <input type="text" name="ho_va_ten" class="input-control" placeholder="Ví dụ: Nguyễn Văn An" required />
      </div>

      <div class="form-group">
        <label>Số điện thoại liên hệ *</label>
        <input type="tel" name="so_dien_thoai" class="input-control" placeholder="0988xxxxxx" required />
      </div>

      <div class="form-group">
        <label>Số CCCD / Định danh</label>
        <input type="text" name="cccd" class="input-control" placeholder="00109xxxxxxxx" />
      </div>

      <div class="form-group">
        <label>Giới tính</label>
        <select name="id__gioi_tinh" class="select-control">
          <option value="1">Nam</option>
          <option value="2">Nữ</option>
        </select>
      </div>

      <!-- ĐỊA CHỈ QUÊ QUÁN KHÁCH THUÊ (CASCADING DROPDOWN) -->
      <div class="form-group">
        <label>Tỉnh / TP Quê quán</label>
        <select name="que_tinh" class="select-control">
          <option value="">-- Chọn Tỉnh / TP --</option>
        </select>
      </div>

      <div class="form-group">
        <label>Quận / Huyện quê quán</label>
        <select name="que_quan_huyen" class="select-control">
          <option value="">-- Chọn Tỉnh trước --</option>
        </select>
      </div>

      <div class="form-group">
        <label>Phường / Xã quê quán</label>
        <select name="que_phuong_xa" class="select-control">
          <option value="">-- Chọn Quận/Huyện trước --</option>
        </select>
      </div>

      <div class="form-group">
        <label>Thôn / Xóm / Số nhà</label>
        <input type="text" name="que_chi_tiet" class="input-control" placeholder="Ví dụ: Xóm 5, Thôn Đông..." />
      </div>

      <!-- 3. ĐIỀU KHOẢN HỢP ĐỒNG -->
      <div class="form-group full" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-top: 0.5rem; margin-bottom: 0.25rem;">
        <label style="font-weight: 700; color: var(--primary-blue); font-size: 0.95rem;">
          <i class="fa-solid fa-file-signature"></i> 3. Điều Khoản Thuê & Chi Phí
        </label>
      </div>

      <div class="form-group">
        <label>Ngày bắt đầu thuê *</label>
        <input type="date" name="ngay_bat_dau" class="input-control" value="${new Date().toISOString().split('T')[0]}" required />
      </div>
      <div class="form-group">
        <label>Ngày kết thúc hợp đồng</label>
        <input type="date" name="ngay_ket_thuc" class="input-control" />
      </div>
      <div class="form-group">
        <label>Kỳ hạn ở (thời hạn thuê)</label>
        <input type="text" name="ky_han_o" class="input-control" value="6 tháng" />
      </div>
      <div class="form-group">
        <label>Số người ở</label>
        <input type="number" name="so_nguoi" class="input-control" value="2" required />
      </div>
      <div class="form-group">
        <label>Giá thuê phòng (VNĐ/tháng) *</label>
        <input type="number" name="gia_thue_phong" class="input-control" value="${giaThue || 2800000}" required />
      </div>
      <div class="form-group">
        <label>Tiền đặt cọc (VNĐ)</label>
        <input type="number" name="tien_coc" class="input-control" value="${giaThue || 2800000}" />
      </div>
      <div class="form-group">
        <label>Đơn giá điện (VNĐ/kWh)</label>
        <input type="number" name="don_gia_dien" class="input-control" value="3500" />
      </div>
      <div class="form-group">
        <label>Đơn giá nước (VNĐ/người/tháng)</label>
        <input type="number" name="don_gia_nuoc" class="input-control" value="100000" />
      </div>
      <div class="form-group">
        <label>Dịch vụ chung (Rác, Wifi VNĐ)</label>
        <input type="number" name="don_gia_dich_vu" class="input-control" value="150000" />
      </div>
      <div class="form-group">
        <label>Đơn giá gửi xe (VNĐ/xe)</label>
        <input type="number" name="don_gia_gui_xe" class="input-control" value="100000" />
      </div>
    </div>
  `, async (payload) => {
    // Ghép thông tin quê quán
    const fullQueQuan = [payload.que_chi_tiet, payload.que_phuong_xa, payload.que_quan_huyen, payload.que_tinh].filter(Boolean).join(', ');
    const hopDongPayload = {
      ...payload,
      que_quan: fullQueQuan || payload.que_tinh || '',
      tinh: payload.que_tinh,
      thanh_pho_quan_huyen_xa: [payload.que_quan_huyen, payload.que_phuong_xa].filter(Boolean).join(', '),
      chi_tiet_ngo_so_nha: payload.que_chi_tiet || ''
    };
    await api.createHopDong(hopDongPayload);
    showToast('Tạo khách thuê và lập hợp đồng thành công!');
    loadHopDongView();
  }, (container) => {
    setupCascadingAddress(container, 'que_');
  });
}

function openThemTaiSanModal(idPhong, tenPhong) {
  openModal(`Bàn Giao Trang Thiết Bị Cho Phòng ${tenPhong}`, `
    <input type="hidden" name="id__phong" value="${idPhong}" />
    <div class="form-grid">
      <div class="form-group full">
        <label>Tên chi tiết thiết bị / tài sản *</label>
        <input type="text" name="ten_chi_tiet" class="input-control" placeholder="Điều hòa Daikin 9000 BTU" required />
      </div>
      <div class="form-group">
        <label>Phân loại tài sản</label>
        <select name="id__phan_loai" class="select-control">
          <option value="1">Điện lạnh & Điện gia dụng</option>
          <option value="2">Nội thất gỗ</option>
          <option value="3">Thiết bị vệ sinh</option>
          <option value="4">Khóa cửa & An ninh</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tình trạng sử dụng</label>
        <select name="id__tinh_trang" class="select-control">
          <option value="1">Mới 100%</option>
          <option value="2" selected>Đang sử dụng tốt</option>
          <option value="3">Hao mòn theo thời gian</option>
          <option value="4">Hỏng hóc cần sửa chữa</option>
        </select>
      </div>
      <div class="form-group full">
        <label>Mô tả chi tiết</label>
        <textarea name="mo_ta" class="input-control" rows="2" placeholder="Ghi chú thêm về thiết bị..."></textarea>
      </div>
    </div>
  `, async (payload) => {
    await api.createTaiSan(payload);
    showToast('Thêm trang thiết bị thành công!');
    renderPhongDetail();
  });
}

function openGhiDienModal() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  openModal('Ghi Nhận Chỉ Số Điện Định Kỳ', `
    <div class="form-grid">
      <div class="form-group full">
        <label>Chọn phòng trọ *</label>
        <select name="id__phong" class="select-control" required>
          ${state.phongList.map(p => `<option value="${p.id}">Phòng ${p.ten_phong} (${p.ten_day_tro || ''})</option>`).join('')}
        </select>
      </div>
      <div class="form-group full">
        <label>Kỳ chốt tháng *</label>
        <input type="month" name="ky_chot" class="input-control" value="${currentMonth}" required />
      </div>
      <div class="form-group">
        <label>Chỉ số điện cũ (kWh) *</label>
        <input type="number" name="dien_cu" class="input-control" value="0" required />
      </div>
      <div class="form-group">
        <label>Chỉ số điện mới (kWh) *</label>
        <input type="number" name="dien_moi" class="input-control" placeholder="Nhập chỉ số điện mới" required />
      </div>
    </div>
  `, async (payload) => {
    await api.chotChiSoDien(payload);
    showToast('Ghi nhận số điện thành công!');
    switchTab('dien-nuoc');
  });
}

function openTaoHoaDonModal() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  openModal('Lập Hóa Đơn Thu Tiền Tự Động', `
    <div class="form-grid">
      <div class="form-group full">
        <label>Chọn phòng thu tiền (theo hợp đồng) *</label>
        <select name="id__hop_dong" class="select-control" required>
          ${state.hopDongList.map(h => `<option value="${h.id}">Phòng ${h.ten_phong} (${h.ten_day_tro}) - Tiền trọ: ${dinhDangTien(h.gia_thue_phong)} VNĐ</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Kỳ thanh toán (tháng/năm) *</label>
        <input type="month" name="ky_thanh_toan" class="input-control" value="${currentMonth}" required />
      </div>
      <div class="form-group">
        <label>Kèm chỉ số điện đã chốt</label>
        <select name="id__dien" class="select-control">
          <option value="">-- Không kèm chỉ số điện --</option>
          ${state.dienList.map(d => `<option value="${d.id}">Phòng ${d.ten_phong} (Kỳ ${d.ky_chot}: ${d.so_dien_tieu_thu} kWh)</option>`).join('')}
        </select>
      </div>
    </div>
  `, async (payload) => {
    await api.createHoaDon(payload);
    showToast('Lập hóa đơn thành công!');
    loadHoaDonView();
  });
}

function openDoiTrangThaiPhongModal(idPhong) {
  openModal('Cập Nhật Trạng Thái Phòng', `
    <div class="form-group full">
      <label>Chọn trạng thái mới *</label>
      <select name="id__trang_thai" class="select-control" required>
        <option value="1">Phòng trống</option>
        <option value="2">Đang có khách thuê</option>
        <option value="3">Đang sửa chữa / Bảo trì</option>
        <option value="4">Đã đặt cọc giữ chỗ</option>
      </select>
    </div>
  `, async (payload) => {
    await api.updateTrangThaiPhong(idPhong, payload.id__trang_thai);
    showToast('Cập nhật trạng thái thành công!');
    loadPhongView();
  });
}

function openChinhSuaHoaDonModal(hd) {
  openModal(`Cập Nhật Hóa Đơn #HD-${hd.id}`, `
    <div class="form-grid">
      <div class="form-group full">
        <label>Trạng thái thanh toán *</label>
        <select name="id__trang_thai" class="select-control" required>
          <option value="1" ${hd.id__trang_thai === 1 ? 'selected' : ''}>Chờ thanh toán</option>
          <option value="2" ${hd.id__trang_thai === 2 ? 'selected' : ''}>Đã thanh toán đủ</option>
          <option value="3" ${hd.id__trang_thai === 3 ? 'selected' : ''}>Thanh toán một phần</option>
          <option value="4" ${hd.id__trang_thai === 4 ? 'selected' : ''}>Quá hạn thanh toán</option>
        </select>
      </div>
      <div class="form-group full">
        <label>Ngày nhận tiền</label>
        <input type="date" name="ngay_nhan_tien" class="input-control" value="${hd.ngay_nhan_tien ? new Date(hd.ngay_nhan_tien).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" />
      </div>
    </div>
  `, async (payload) => {
    await api.capNhatTrangThaiHoaDon(hd.id, payload);
    showToast('Cập nhật hóa đơn thành công!');
    loadHoaDonView();
  });
}

// ==========================================
// ROUTER & NAVIGATION
// ==========================================

function switchTab(tabName) {
  state.currentTab = tabName;
  state.selectedId = null;
  state.activeFilter = 'all';

  document.querySelectorAll('.slim-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabName);
  });

  switch (tabName) {
    case 'so-do-phong': loadPhongView(); break;
    case 'hop-dong': loadHopDongView(); break;
    case 'day-tro': loadDayTroView(); break;
    case 'dien-nuoc': loadDienView(); break;
    case 'hoa-don': loadHoaDonView(); break;
    case 'tai-san-sua-chua': loadTaiSanView(); break;
    case 'dashboard': loadPhongView(); break;
    default: loadPhongView();
  }
}

// Initialize Application
async function init() {
  const sidebar = document.getElementById('sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnDetailPrev = document.getElementById('btn-detail-prev');
  const btnDetailNext = document.getElementById('btn-detail-next');
  const btnDetailExpand = document.getElementById('btn-detail-expand');

  if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.onclick = () => {
      sidebar.classList.toggle('expanded');
    };
  }

  document.querySelectorAll('.slim-item').forEach(btn => {
    if (btn.dataset.tab) {
      btn.onclick = () => switchTab(btn.dataset.tab);
    }
  });

  btnDetailClose.onclick = () => {
    detailPanel.style.display = detailPanel.style.display === 'none' ? 'flex' : 'none';
  };

  function getActiveListInfo() {
    switch (state.currentTab) {
      case 'so-do-phong':
      case 'phong': return { list: state.phongList, render: renderPhongDetail };
      case 'hop-dong': return { list: state.hopDongList, render: renderHopDongDetail };
      case 'day-tro': return { list: state.dayTroList, render: renderDayTroDetail };
      case 'dien-nuoc': return { list: state.dienList, render: renderDienDetail };
      case 'hoa-don': return { list: state.hoaDonList, render: renderHoaDonDetail };
      case 'tai-san-sua-chua': return { list: state.suaChuaList, render: renderTaiSanDetail };
      default: return { list: state.phongList, render: renderPhongDetail };
    }
  }

  function navigateRecord(direction) {
    const { list, render } = getActiveListInfo();
    if (!list || list.length === 0) return;
    const currentIndex = list.findIndex(item => Number(item.id) === Number(state.selectedId));
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= list.length) newIndex = list.length - 1;
    const target = list[newIndex];
    if (target) {
      selectRecord(target.id, render);
      const row = masterTableWrapper.querySelector(`.master-row[data-id="${target.id}"]`);
      if (row) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  if (btnDetailPrev) {
    btnDetailPrev.onclick = () => navigateRecord(-1);
  }

  if (btnDetailNext) {
    btnDetailNext.onclick = () => navigateRecord(1);
  }

  if (btnDetailExpand) {
    btnDetailExpand.onclick = () => {
      detailPanel.classList.toggle('expanded');
      const isExpanded = detailPanel.classList.contains('expanded');
      btnDetailExpand.innerHTML = isExpanded 
        ? `<i class="fa-solid fa-down-left-and-up-right-to-center"></i>` 
        : `<i class="fa-solid fa-up-right-and-down-left-from-center"></i>`;
      btnDetailExpand.title = isExpanded ? "Thu gọn panel" : "Mở rộng 1 nửa màn hình";
    };
  }

  try {
    const [dayTroRes, phongRes, hdRes, dienRes, nhanVienRes] = await Promise.all([
      api.getDayTro(),
      api.getPhong(),
      api.getHopDong(),
      api.getChiSoDien(),
      api.getNhanVien(),
    ]);

    state.dayTroList = dayTroRes.data || [];
    state.phongList = phongRes.data || [];
    state.hopDongList = hdRes.data || [];
    state.dienList = dienRes.data || [];
    state.nhanVienList = nhanVienRes.data || [];
  } catch (err) {
    console.error('API Init Error:', err);
  }

  // Load default view: Sơ đồ phòng
  switchTab('so-do-phong');
}

init();

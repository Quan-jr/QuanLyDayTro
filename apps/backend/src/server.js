import app from './app.js';
import { pool } from './config/db.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Kiểm tra kết nối PostgreSQL
    const dbTest = await pool.query('SELECT NOW() AS now, current_database() AS db_name');
    console.log(`✅ Kết nối thành công đến PostgreSQL [${dbTest.rows[0].db_name}] vào lúc:`, dbTest.rows[0].now);

    app.listen(PORT, () => {
      console.log(`🚀 Máy chủ Backend Modular Monolith đang chạy tại: http://localhost:${PORT}`);
      console.log(`📡 API Endpoints sẵn sàng tại: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Lỗi kết nối cơ sở dữ liệu PostgreSQL:', error.message);
    process.exit(1);
  }
}

startServer();

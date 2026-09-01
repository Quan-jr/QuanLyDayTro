import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';

// Modular Monolith Routes
import danhMucRoutes from './modules/danh-muc/danh-muc.routes.js';
import coSoVatChatRoutes from './modules/co-so-vat-chat/co-so-vat-chat.routes.js';
import hopDongRoutes from './modules/hop-dong/hop-dong.routes.js';
import dienNuocRoutes from './modules/dien-nuoc/dien-nuoc.routes.js';
import hoaDonRoutes from './modules/hoa-don/hoa-don.routes.js';
import nhanSuRoutes from './modules/nhan-su/nhan-su.routes.js';
import thongKeRoutes from './modules/thong-ke/thong-ke.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend Quản Lý Dãy Trọ Modular Monolith đang hoạt động tốt',
    timestamp: new Date(),
  });
});

// Register Domain Modules
app.use('/api/danh-muc', danhMucRoutes);
app.use('/api/co-so-vat-chat', coSoVatChatRoutes);
app.use('/api/hop-dong', hopDongRoutes);
app.use('/api/dien-nuoc', dienNuocRoutes);
app.use('/api/hoa-don', hoaDonRoutes);
app.use('/api/nhan-su', nhanSuRoutes);
app.use('/api/thong-ke', thongKeRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;

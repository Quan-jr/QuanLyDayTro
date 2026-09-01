export function errorHandler(err, req, res, next) {
  console.error(' [Error Middleware]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Lỗi hệ thống máy chủ';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

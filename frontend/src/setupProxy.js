const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /api requests to backend
  app.use(
    createProxyMiddleware('/api', {
      target: 'http://localhost:8001',
      changeOrigin: true,
    })
  );
};

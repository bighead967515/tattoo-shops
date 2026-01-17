const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /api requests to backend on port 8001
  // By default, the matched path '/api' is stripped, so we need pathRewrite to keep it
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8001',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Keep the /api prefix
      },
    })
  );
};

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 9999;

// Proxy middleware for IMDb videos
app.use('/proxy', createProxyMiddleware({
  target: 'https://imdb-video.media-imdb.com',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '', // remove /proxy prefix
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://www.imdb.com/',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Remove cookies to avoid tracking
    proxyReq.removeHeader('cookie');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Proxy server is running' });
});

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
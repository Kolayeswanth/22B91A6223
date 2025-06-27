const express = require('express');
const { Log, Logger } = require('../Logging Middleware/logger');
const urlController = require('./controllers/urlController');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  Logger.info('request', `${req.method} ${req.path}`);
  next();
});

// Health check - simple status endpoint
app.get('/health', (req, res) => {
  Logger.info('health', 'Health check accessed');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'URL Shortener Microservice'
  });
});

// Main API endpoints
app.post('/shorturls', urlController.createShortUrl);
app.get('/:shortcode', urlController.redirectToOriginal);
app.get('/shorturls/:shortcode', urlController.getUrlStatistics);

// Handle 404s
app.use((req, res) => {
  Logger.warn('404', `Not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found'
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  Logger.error('server', err.message);
  res.status(500).json({
    error: 'Internal Server Error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 URL Shortener running on http://localhost:${PORT}`);
  Logger.info('server', `Server started on port ${PORT}`);
});

module.exports = app;
